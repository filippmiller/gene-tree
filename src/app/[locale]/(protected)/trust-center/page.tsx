import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { ShieldCheck, Lock, Users, EyeOff, FileText } from 'lucide-react';

const copy = {
  en: {
    title: 'Trust Center',
    subtitle: 'How Gene-Tree protects your family story.',
    sections: [
      {
        title: 'Privacy by default',
        icon: ShieldCheck,
        items: [
          'Privacy settings are built into profiles, media, and stories.',
          'You control who can see details like dates, places, and contact info.',
          'No ads. No data brokers. No genetic data collection.',
        ],
      },
      {
        title: 'Consent-based relationships',
        icon: Users,
        items: [
          'Relationships require confirmation before they are verified.',
          'Invites are explicit and traceable to the sender.',
          'You can decline or ignore any invitation.',
        ],
      },
      {
        title: 'Secure access',
        icon: Lock,
        items: [
          'Row-level security protects family data in the database.',
          'Authentication is required for private family views.',
          'Audit logging captures sensitive actions for review.',
        ],
      },
      {
        title: 'Data minimization',
        icon: EyeOff,
        items: [
          'Only collect what is needed to build your family story.',
          'You can leave fields blank or mark them private.',
          'Deceased profiles support memorial content without contact info.',
        ],
      },
    ],
    actionsTitle: 'Your controls',
    actionsBody: 'Review and update your personal information and visibility settings at any time.',
    actionsPrimary: 'Open profile settings',
    actionsSecondary: 'Back to dashboard',
    transparencyTitle: 'Transparency',
    transparencyBody:
      'If you ever want a deeper technical breakdown, we can document the exact policies and controls we use. Tell us what you need.',
  },
  ru: {
    title: 'Ð¦ÐµÐ½Ñ‚Ñ€ Ð´Ð¾Ð²ÐµÑ€Ð¸Ñ',
    subtitle: 'ÐšÐ°Ðº Gene-Tree Ð·Ð°Ñ‰Ð¸Ñ‰Ð°ÐµÑ‚ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ Ð²Ð°ÑˆÐµÐ¹ ÑÐµÐ¼ÑŒÐ¸.',
    sections: [
      {
        title: 'ÐŸÑ€Ð¸Ð²Ð°Ñ‚Ð½Ð¾ÑÑ‚ÑŒ Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ',
        icon: ShieldCheck,
        items: [
          'Ð¡Ð²ÐµÐ´ÐµÐ½Ð¸Ñ Ð¾ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ðµ, Ð¼ÐµÐ´Ð¸Ð° Ð¸ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑÑ… Ð¸Ð¼ÐµÑŽÑ‚ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ Ð¿Ñ€Ð¸Ð²Ð°Ñ‚Ð½Ð¾ÑÑ‚Ð¸.',
          'Ð’Ñ‹ Ñ€ÐµÑˆÐ°ÐµÑ‚Ðµ, ÐºÑ‚Ð¾ Ð²Ð¸Ð´Ð¸Ñ‚ Ð´Ð°Ñ‚Ñ‹, Ð¼ÐµÑÑ‚Ð° Ð¸ ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ñ‹.',
          'ÐÐµÑ‚ Ñ€ÐµÐºÐ»Ð°Ð¼Ñ‹. ÐÐµÑ‚ Ð¿ÐµÑ€ÐµÐ´Ð°Ñ‡Ð¸ Ð´Ð°Ð½Ð½Ñ‹Ñ…. ÐÐµÑ‚ Ð³ÐµÐ½ÐµÑ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ñ… Ñ‚ÐµÑÑ‚Ð¾Ð².',
        ],
      },
      {
        title: 'ÐžÑ‚Ð½Ð¾ÑˆÐµÐ½Ð¸Ñ Ñ Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð¸ÐµÐ¼',
        icon: Users,
        items: [
          'Ð¡Ð²ÑÐ·Ð¸ Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´Ð°ÑŽÑ‚ÑÑ Ð¿ÐµÑ€ÐµÐ´ Ñ‚ÐµÐ¼, ÐºÐ°Ðº ÑÑ‚Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð½Ñ‹Ð¼Ð¸.',
          'ÐŸÑ€Ð¸Ð³Ð»Ð°ÑˆÐµÐ½Ð¸Ñ Ð¿Ñ€Ð¾Ð·Ñ€Ð°Ñ‡Ð½Ñ‹ Ð¸ Ð²ÑÐµÐ³Ð´Ð° Ð¾Ñ‚ ÐºÐ¾Ð½ÐºÑ€ÐµÑ‚Ð½Ð¾Ð³Ð¾ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÐµÐ»Ñ.',
          'Ð’Ñ‹ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð¾Ñ‚ÐºÐ»Ð¾Ð½Ð¸Ñ‚ÑŒ Ð¸Ð»Ð¸ Ð¸Ð³Ð½Ð¾Ñ€Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¸Ð³Ð»Ð°ÑˆÐµÐ½Ð¸Ðµ.',
        ],
      },
      {
        title: 'Ð‘ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ñ‹Ð¹ Ð´Ð¾ÑÑ‚ÑƒÐ¿',
        icon: Lock,
        items: [
          'Row-level security Ð·Ð°Ñ‰Ð¸Ñ‰Ð°ÐµÑ‚ ÑÐµÐ¼ÐµÐ¹Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð² Ð±Ð°Ð·Ðµ.',
          'Ð”Ð»Ñ Ð¿Ñ€Ð¸Ð²Ð°Ñ‚Ð½Ñ‹Ñ… Ñ€Ð°Ð·Ð´ÐµÐ»Ð¾Ð² Ð½ÑƒÐ¶ÐµÐ½ Ð²Ñ…Ð¾Ð´ Ð² ÑÐ¸ÑÑ‚ÐµÐ¼Ñƒ.',
          'Ð›Ð¾Ð³Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¾ÑÑ‚Ð¸ Ñ„Ð¸ÐºÑÐ¸Ñ€ÑƒÐµÑ‚ Ð²Ð°Ð¶Ð½Ñ‹Ðµ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ.',
        ],
      },
      {
        title: 'ÐœÐ¸Ð½Ð¸Ð¼ÑƒÐ¼ Ð´Ð°Ð½Ð½Ñ‹Ñ…',
        icon: EyeOff,
        items: [
          'ÐœÑ‹ ÑÐ¾Ð±Ð¸Ñ€Ð°ÐµÐ¼ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð½ÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð¾Ðµ Ð´Ð»Ñ ÑÐµÐ¼ÐµÐ¹Ð½Ð¾Ð¹ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ð¸.',
          'Ð’Ñ‹ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð¾ÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ð¾Ð»Ñ Ð¿ÑƒÑÑ‚Ñ‹Ð¼Ð¸ Ð¸Ð»Ð¸ ÑÐºÑ€Ñ‹Ñ‚ÑŒ Ð¸Ñ….',
          'Ð”Ð»Ñ Ð¿Ð¾ÐºÐ¾Ð¹Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ñ„Ð¸Ð»ÐµÐ¹ Ð¿Ð¾Ð´Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÐµÑ‚ÑÑ Ð¼ÐµÐ¼Ð¾Ñ€Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ð¹ Ñ€ÐµÐ¶Ð¸Ð¼ Ð±ÐµÐ· ÐºÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¾Ð².',
        ],
      },
    ],
    actionsTitle: 'Ð’Ð°ÑˆÐ¸ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸',
    actionsBody: 'ÐŸÑ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ð¸Ñ‚Ðµ Ð¸ Ð¾Ð±Ð½Ð¾Ð²Ð¸Ñ‚Ðµ Ð»Ð¸Ñ‡Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð¸ Ð²Ð¸Ð´Ð¸Ð¼Ð¾ÑÑ‚ÑŒ Ð² Ð»ÑŽÐ±Ð¾Ð¹ Ð¼Ð¾Ð¼ÐµÐ½Ñ‚.',
    actionsPrimary: 'ÐžÑ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ñ',
    actionsSecondary: 'Ð’ÐµÑ€Ð½ÑƒÑ‚ÑŒÑÑ Ð² Ð¿Ð°Ð½ÐµÐ»ÑŒ',
    transparencyTitle: 'ÐŸÑ€Ð¾Ð·Ñ€Ð°Ñ‡Ð½Ð¾ÑÑ‚ÑŒ',
    transparencyBody:
      'Ð•ÑÐ»Ð¸ Ð½ÑƒÐ¶ÐµÐ½ Ð±Ð¾Ð»ÐµÐµ Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ñ€Ð°Ð·Ð±Ð¾Ñ€ Ñ€Ð°Ð±Ð¾Ñ‚Ñ‹, Ð¼Ñ‹ Ð¾Ð¿Ð¸ÑˆÐµÐ¼ Ñ‚Ð¾Ñ‡Ð½Ñ‹Ðµ Ð¿Ð¾Ð»Ð¸Ñ‚Ð¸ÐºÐ¸ Ð¸ ÐºÐ¾Ð½Ñ‚Ñ€Ð¾Ð»Ð¸. Ð¡ÐºÐ°Ð¶Ð¸Ñ‚Ðµ, Ñ‡Ñ‚Ð¾ Ð²Ð°Ð¼ Ð½ÑƒÐ¶Ð½Ð¾.',
  },
};

export default async function TrustCenterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await getSupabaseSSR();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/sign-in`);

  const t = copy[locale as keyof typeof copy] || copy.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50">
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-4 py-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {t.subtitle}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">{t.title}</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t.actionsTitle}</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">{t.actionsBody}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/family-profile/settings`}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {t.actionsPrimary}
            </Link>
            <Link
              href={`/${locale}/app`}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {t.actionsSecondary}
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          <strong className="block text-slate-800 mb-2">{t.transparencyTitle}</strong>
          {t.transparencyBody}
        </section>
      </main>
    </div>
  );
}
