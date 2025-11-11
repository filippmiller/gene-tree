import { redirect } from 'next/navigation';
import { supabaseSSR } from '@/lib/supabase/server-ssr';
import TreeCanvasWrapper from '@/components/tree/TreeCanvasWrapper';

interface Props {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function TreePage({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await supabaseSSR();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Family Tree Visualization
        </h1>
      </header>
      <div className="flex-1">
        <TreeCanvasWrapper rootPersonId={id} currentUserId={user.id} />
      </div>
    </div>
  );
}
