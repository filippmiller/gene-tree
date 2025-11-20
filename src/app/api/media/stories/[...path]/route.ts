import { NextResponse } from 'next/server';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const supabase = await getSupabaseSSR();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reconstruct the file path from the catch-all segments
    const filePath = path.join('/');

    if (!filePath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Generate a signed URL valid for 1 hour
    const { data, error } = await supabase
      .storage
      .from('stories')
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json({ error: 'Media not found or access denied' }, { status: 404 });
    }

    // Redirect to the signed URL
    return NextResponse.redirect(data.signedUrl);

  } catch (error: any) {
    console.error('Error in media proxy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
