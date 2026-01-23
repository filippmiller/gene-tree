import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import type {
  AnswerQuestionRequest,
  AnswerQuestionResponse,
} from '@/types/elder-questions';

/**
 * PATCH /api/elder-questions/[id]
 * Answer or decline a question
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the question
    const { data: question, error: fetchError } = await (supabase as any)
      .from('elder_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    // Only the elder can answer
    if (question.elder_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the elder can answer this question' },
        { status: 403 }
      );
    }

    // Can only answer pending questions
    if (question.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This question has already been answered or declined' },
        { status: 400 }
      );
    }

    const body: AnswerQuestionRequest & { decline?: boolean } = await req.json();

    let updateData: Record<string, unknown>;

    if (body.decline) {
      // Decline the question
      updateData = {
        status: 'declined',
        answered_at: new Date().toISOString(),
      };
    } else {
      // Answer the question
      if (!body.answer?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Answer is required' },
          { status: 400 }
        );
      }

      updateData = {
        answer: body.answer.trim(),
        status: 'answered',
        answered_at: new Date().toISOString(),
        ...(body.visibility && { visibility: body.visibility }),
      };
    }

    const { data: updatedQuestion, error: updateError } = await (supabase as any)
      .from('elder_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating question:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Notify the asker
    try {
      const eventType = body.decline ? 'ELDER_QUESTION_DECLINED' : 'ELDER_QUESTION_ANSWERED';
      const title = body.decline ? 'Question declined' : 'Your question was answered!';

      await (supabase as any).from('notifications').insert({
        profile_id: question.asker_id,
        event_type: eventType,
        title,
        body: body.decline
          ? 'The elder has declined to answer your question'
          : 'Check out the answer to your question',
        link_url: `/elder-questions`,
        metadata: { question_id: id },
      });
    } catch {
      // Non-critical, continue
    }

    const response: AnswerQuestionResponse = {
      success: true,
      question: updatedQuestion,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error in PATCH /api/elder-questions/[id]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/elder-questions/[id]
 * Delete a question (asker only)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the question
    const { data: question, error: fetchError } = await (supabase as any)
      .from('elder_questions')
      .select('asker_id')
      .eq('id', id)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    // Only the asker can delete
    if (question.asker_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the asker can delete this question' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await (supabase as any)
      .from('elder_questions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/elder-questions/[id]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
