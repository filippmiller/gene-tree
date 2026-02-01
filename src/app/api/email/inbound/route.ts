/**
 * Email Reply Parser for Stories
 *
 * Receives inbound emails from Resend webhook and creates stories from replies.
 * Elder users can simply reply to weekly prompt emails to submit their stories.
 *
 * Webhook setup in Resend:
 * 1. Configure inbound domain (e.g., stories.gene-tree.com)
 * 2. Set webhook URL to this endpoint
 * 3. Set RESEND_WEBHOOK_SECRET in environment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Types for Resend inbound email webhook
interface ResendInboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    content_type: string;
  }>;
}

interface WebhookPayload {
  type: 'email.received';
  created_at: string;
  data: ResendInboundEmail;
}

// Verify Resend webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Extract email address from "Name <email@domain.com>" format
function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : from.toLowerCase().trim();
}

// Extract prompt ID from subject line if present
// Subject format: "Re: Your Weekly Story Prompt [PROMPT:abc123]"
function extractPromptId(subject: string): string | null {
  const match = subject.match(/\[PROMPT:([a-f0-9-]+)\]/i);
  return match ? match[1] : null;
}

// Clean up email text content
function cleanEmailContent(text: string): string {
  // Remove common email reply markers
  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    // Stop at reply separator
    if (line.startsWith('On ') && line.includes(' wrote:')) break;
    if (line.startsWith('>')) continue; // Skip quoted text
    if (line.includes('---------- Forwarded message')) break;
    if (line.includes('-------- Original Message')) break;
    if (line.trim() === '--') break; // Email signature separator

    cleanedLines.push(line);
  }

  return cleanedLines.join('\n').trim();
}

// Generate a title from the content
function generateTitle(content: string, promptText?: string): string {
  if (promptText) {
    // Use a shortened version of the prompt
    const shortPrompt = promptText.slice(0, 50);
    return shortPrompt.endsWith('?') ? shortPrompt : shortPrompt + '...';
  }

  // Use first sentence or first 50 chars
  const firstSentence = content.match(/^[^.!?]+[.!?]/);
  if (firstSentence && firstSentence[0].length <= 80) {
    return firstSentence[0];
  }

  return content.slice(0, 50) + '...';
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Email Inbound] Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const rawBody = await request.text();

    // Verify webhook signature in production
    if (webhookSecret && process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('resend-signature') || '';
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error('[Email Inbound] Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody);

    if (payload.type !== 'email.received') {
      return NextResponse.json({ message: 'Ignored event type' }, { status: 200 });
    }

    const email = payload.data;
    const senderEmail = extractEmail(email.from);
    const content = cleanEmailContent(email.text);

    // Skip empty responses
    if (!content || content.length < 10) {
      console.log('[Email Inbound] Empty or too short response, skipping');
      return NextResponse.json({ message: 'Content too short' }, { status: 200 });
    }

    // Find the user by email
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[Email Inbound] Failed to query users:', authError);
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 });
    }

    const matchedUser = authUser.users.find(
      (u) => u.email?.toLowerCase() === senderEmail
    );

    if (!matchedUser) {
      console.log(`[Email Inbound] No user found for email: ${senderEmail}`);
      // Could send a reply email here explaining the user needs to register
      return NextResponse.json({ message: 'User not found' }, { status: 200 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .eq('id', matchedUser.id)
      .single();

    if (profileError || !profile) {
      console.error('[Email Inbound] User profile not found:', profileError);
      return NextResponse.json({ message: 'Profile not found' }, { status: 200 });
    }

    // Check for prompt reference in subject
    const promptId = extractPromptId(email.subject);
    let promptText: string | undefined;

    if (promptId) {
      const { data: prompt } = await supabase
        .from('story_prompts')
        .select('prompt_text')
        .eq('id', promptId)
        .single();

      promptText = prompt?.prompt_text;
    }

    // Create the story
    const title = generateTitle(content, promptText);

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        author_id: profile.id,
        subject_id: profile.id, // Story about themselves
        media_type: 'text',
        content: content,
        title: title,
        visibility: 'family',
        status: 'approved', // Auto-approve email submissions from verified users
      })
      .select('id')
      .single();

    if (storyError) {
      console.error('[Email Inbound] Failed to create story:', storyError);
      return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
    }

    // Mark the prompt as answered if we have a prompt reference
    if (promptId) {
      const { error: historyError } = await supabase.rpc('mark_prompt_answered', {
        p_user_id: matchedUser.id,
        p_prompt_id: promptId,
        p_story_id: story.id,
      });

      if (historyError) {
        console.warn('[Email Inbound] Failed to mark prompt answered:', historyError);
        // Non-fatal error, story was still created
      }
    }

    // Log the activity
    await supabase.from('activity_events').insert({
      event_type: 'story_created',
      actor_id: profile.id,
      subject_type: 'story',
      subject_id: story.id,
      display_data: {
        actor_name: `${profile.first_name} ${profile.last_name}`,
        subject_title: title,
        source: 'email_reply',
      },
      visibility: 'family',
    });

    console.log(`[Email Inbound] Created story ${story.id} from ${senderEmail}`);

    return NextResponse.json({
      success: true,
      story_id: story.id,
      prompt_id: promptId,
    });

  } catch (error) {
    console.error('[Email Inbound] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Health check / verification endpoint for webhook setup
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'email-inbound-webhook',
    timestamp: new Date().toISOString(),
  });
}
