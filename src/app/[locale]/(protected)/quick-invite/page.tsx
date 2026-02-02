import { Metadata } from 'next';
import { MyQuickLinks } from '@/components/quick-invite';

export const metadata: Metadata = {
  title: 'Quick Invite Links | Gene-Tree',
  description: 'Create and manage quick invite links for family events',
};

interface QuickInvitePageProps {
  params: Promise<{ locale: string }>;
}

const translations = {
  en: {
    title: 'Quick Invite Links',
    subtitle: 'Create shareable links with QR codes for family events and reunions',
    description:
      'Quick invite links are perfect for family reunions, gatherings, or any event where you want multiple people to join your family tree. Share a link or QR code, and approve new members as they sign up.',
    howItWorks: 'How it works',
    steps: [
      'Create an invite link with an optional event name',
      'Share the link or QR code with family members',
      'People sign up by providing their name and relationship',
      'Review and approve signups to add them to your family',
    ],
  },
  ru: {
    title: 'Быстрые ссылки-приглашения',
    subtitle: 'Создавайте ссылки с QR-кодами для семейных мероприятий',
    description:
      'Быстрые ссылки-приглашения идеально подходят для семейных встреч, праздников или любых мероприятий, где вы хотите пригласить много людей в семейное дерево. Поделитесь ссылкой или QR-кодом и одобряйте новых участников.',
    howItWorks: 'Как это работает',
    steps: [
      'Создайте ссылку с названием мероприятия (опционально)',
      'Поделитесь ссылкой или QR-кодом с членами семьи',
      'Люди регистрируются, указывая имя и родство',
      'Проверяйте и одобряйте заявки для добавления в семью',
    ],
  },
};

export default async function QuickInvitePage({ params }: QuickInvitePageProps) {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations.en;

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-lg text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Description */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      {/* How it works */}
      <div className="space-y-3">
        <h2 className="font-semibold">{t.howItWorks}</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          {t.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Quick Links Management */}
      <MyQuickLinks locale={locale} />
    </div>
  );
}
