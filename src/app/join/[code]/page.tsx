import { Metadata } from 'next';
import { headers } from 'next/headers';
import { QuickLinkSignupForm } from '@/components/quick-invite/QuickLinkSignupForm';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, Users } from 'lucide-react';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

interface LinkInfo {
  valid: boolean;
  link?: {
    id: string;
    code: string;
    eventName: string | null;
    expiresAt: string;
    remainingUses: number;
    creator: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  error?: string;
}

const translations = {
  en: {
    title: 'Join Family Tree',
    invalidLink: 'Invalid Invite Link',
    linkExpired: 'This invite link has expired',
    linkInactive: 'This invite link is no longer active',
    linkMaxedOut: 'This invite link has reached its maximum uses',
    linkNotFound: 'This invite link was not found',
    tryAgain: 'Please ask for a new invite link',
  },
  ru: {
    title: 'Присоединиться к семейному дереву',
    invalidLink: 'Недействительная ссылка',
    linkExpired: 'Эта ссылка-приглашение истекла',
    linkInactive: 'Эта ссылка-приглашение больше не активна',
    linkMaxedOut: 'Эта ссылка-приглашение достигла максимума использований',
    linkNotFound: 'Ссылка-приглашение не найдена',
    tryAgain: 'Пожалуйста, запросите новую ссылку-приглашение',
  },
};

async function getLinkInfo(code: string): Promise<LinkInfo> {
  try {
    // Get the host from headers for server-side fetch
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const response = await fetch(`${protocol}://${host}/api/quick-links/by-code/${code}`, {
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return { valid: false, error: data.error };
    }

    return data;
  } catch (error) {
    console.error('Error fetching link info:', error);
    return { valid: false, error: 'Failed to fetch link info' };
  }
}

// Detect locale from Accept-Language header
async function detectLocale(): Promise<string> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  if (acceptLanguage.toLowerCase().includes('ru')) {
    return 'ru';
  }
  return 'en';
}

export async function generateMetadata({ params }: JoinPageProps): Promise<Metadata> {
  const { code } = await params;
  const linkInfo = await getLinkInfo(code);

  const creatorName = linkInfo.link?.creator
    ? [linkInfo.link.creator.firstName, linkInfo.link.creator.lastName].filter(Boolean).join(' ')
    : null;

  if (linkInfo.valid && linkInfo.link) {
    const eventTitle = linkInfo.link.eventName || 'a family tree';
    const title = creatorName
      ? `${creatorName} invited you to join ${eventTitle}`
      : `You're invited to join ${eventTitle}`;
    const description = `Join Gene Tree to connect with your family, share stories, and preserve memories together. ${linkInfo.link.remainingUses} spots remaining.`;

    return {
      title: `${title} | Gene Tree`,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'Gene Tree',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  }

  return {
    title: 'Join Family Tree | Gene Tree',
    description: 'Join a family tree on Gene Tree — a privacy-first genealogy platform.',
    openGraph: {
      title: 'Join a Family Tree',
      description: 'Connect with your family, share stories, and preserve memories together on Gene Tree.',
      type: 'website',
      siteName: 'Gene Tree',
    },
  };
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  const linkInfo = await getLinkInfo(code);
  const locale = await detectLocale();

  const t = translations[locale as keyof typeof translations] || translations.en;

  // Invalid or expired link
  if (!linkInfo.valid || !linkInfo.link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-xl font-semibold">{t.invalidLink}</h1>
              <p className="text-muted-foreground">
                {linkInfo.error === 'Link has expired'
                  ? t.linkExpired
                  : linkInfo.error === 'Link is inactive'
                  ? t.linkInactive
                  : linkInfo.error === 'Link has reached maximum uses'
                  ? t.linkMaxedOut
                  : t.linkNotFound}
              </p>
              <p className="text-sm text-muted-foreground">{t.tryAgain}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { link } = linkInfo;
  const creatorName = link.creator
    ? [link.creator.firstName, link.creator.lastName].filter(Boolean).join(' ') || null
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md space-y-6">
        {/* Header info */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          {link.eventName && (
            <p className="text-lg text-primary font-medium">{link.eventName}</p>
          )}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{link.remainingUses} spots left</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                Expires{' '}
                {new Date(link.expiresAt).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <QuickLinkSignupForm
          code={code}
          eventName={link.eventName}
          creatorName={creatorName}
          locale={locale}
        />
      </div>
    </div>
  );
}
