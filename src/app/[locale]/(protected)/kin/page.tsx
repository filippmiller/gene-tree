import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import KinSearchForm from '@/components/kin/KinSearchForm';

export default async function KinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Поиск родства</h1>
      <p className="text-sm text-gray-600">
        Введите фразу на русском, например: "сестра мамы", "дочка сестры мамы", "брат папы"
      </p>

      <KinSearchForm userId={user.id} />
    </div>
  );
}
