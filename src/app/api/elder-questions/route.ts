import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type {
  GetElderQuestionsResponse,
  AskElderRequest,
  AskElderResponse,
} from '@/types/elder-questions';

/**
 * GET /api/elder-questions
 * Get questions (as asker or elder)
 */
export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const role = url.searchParams.get('role') || 'all'; // 'asker', 'elder', 'all'
    const status = url.searchParams.get('status'); // 'pending', 'answered', 'declined'
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 50);
    const offset = (page - 1) * pageSize;

    let query = (supabase as any)
      .from('elder_questions')
      .select(`
        id,
        asker_id,
        elder_id,
        question,
        answer,
        status,
        visibility,
        created_at,
        answered_at,
        asker:user_profiles!asker_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        elder:user_profiles!elder_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `, { count: 'exact' });

    // Filter by role
    if (role === 'asker') {
      query = query.eq('asker_id', user.id);
    } else if (role === 'elder') {
      query = query.eq('elder_id', user.id);
    } else {
      query = query.or(`asker_id.eq.${user.id},elder_id.eq.${user.id}`);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: questions, error, count } = await query;

    if (error) {
      console.error('Error fetching elder questions:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const response: GetElderQuestionsResponse = {
      success: true,
      questions: questions || [],
      total: count || 0,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error in GET /api/elder-questions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/elder-questions
 * Ask a question to an elder
 */
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: AskElderRequest = await req.json();

    // Validate required fields
    if (!body.elder_id || !body.question?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Elder ID and question are required' },
        { status: 400 }
      );
    }

    // Verify the elder exists
    const { data: elder } = await supabase
      .from('user_profiles')
      .select('id, first_name')
      .eq('id', body.elder_id)
      .single();

    if (!elder) {
      return NextResponse.json(
        { success: false, error: 'Elder not found' },
        { status: 404 }
      );
    }

    // Cannot ask yourself
    if (body.elder_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot ask yourself a question' },
        { status: 400 }
      );
    }

    // Create the question
    const { data: question, error: insertError } = await (supabase as any)
      .from('elder_questions')
      .insert({
        asker_id: user.id,
        elder_id: body.elder_id,
        question: body.question.trim(),
        visibility: body.visibility || 'family',
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating question:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Create notification for the elder
    try {
      await (supabase as any).from('notifications').insert({
        profile_id: body.elder_id,
        event_type: 'ELDER_QUESTION_ASKED',
        title: 'New question for you',
        body: `Someone wants to ask you a question`,
        link_url: `/elder-questions`,
        metadata: { question_id: question.id },
      });
    } catch {
      // Non-critical, continue
    }

    const response: AskElderResponse = {
      success: true,
      question,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    console.error('Error in POST /api/elder-questions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
