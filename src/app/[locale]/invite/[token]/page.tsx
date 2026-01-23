import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import InvitationAcceptForm from '@/components/invite/InvitationAcceptForm';

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { locale, token } = await params;
  const supabase = await getSupabaseSSR();

  // Fetch invitation details by token
  const { data: invitation, error } = await supabase
    .from('pending_relatives')
    .select(`
      *,
      inviter:invited_by (
        id,
        email
      ),
      inviter_profile:user_profiles!invited_by (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('invitation_token', token)
    .eq('status', 'pending')
    .single() as any;

  // Handle invalid/expired invitation
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Приглашение не найдено
          </h1>
          <p className="text-gray-600 mb-6">
            Ссылка недействительна или срок действия истёк
          </p>
          <a
            href={`/${locale}/sign-in`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Войти в систему
          </a>
        </div>
      </div>
    );
  }

  // Get inviter name
  const inviterProfile = invitation.inviter_profile as any;
  const inviter = invitation.inviter as any;
  const inviterName = inviterProfile?.[0]
    ? `${inviterProfile[0].first_name} ${inviterProfile[0].last_name}`
    : inviter?.[0]?.email || 'Неизвестный пользователь';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Приглашение в семейное дерево
          </h1>
          <p className="text-gray-600">
            {inviterName} пригласил вас присоединиться к семье
          </p>
        </div>

        {/* Invitation details card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Ваши данные
          </h2>
          
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Имя:</span>
              <span>{invitation.first_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Фамилия:</span>
              <span>{invitation.last_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Email:</span>
              <span>{invitation.email || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Телефон:</span>
              <span>{invitation.phone || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Тип связи:</span>
              <span className="capitalize">{invitation.relationship_type}</span>
            </div>
            {invitation.date_of_birth && (
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Дата рождения:</span>
                <span>{new Date(invitation.date_of_birth).toLocaleDateString('ru-RU')}</span>
              </div>
            )}
            {invitation.is_deceased && (
              <div className="flex justify-between py-2">
                <span className="font-medium">Статус:</span>
                <span className="text-gray-600">† В память об ушедшем</span>
              </div>
            )}
          </div>
        </div>

        {/* Accept/Edit/Reject form */}
        <InvitationAcceptForm 
          invitation={invitation}
          locale={locale}
        />
      </div>
    </div>
  );
}
