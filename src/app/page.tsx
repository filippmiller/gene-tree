import Link from 'next/link';
import { cookies, headers } from 'next/headers';

export const dynamic = 'force-dynamic';
import { TreePine, Users, BookOpen, Shield, Sparkles, ArrowRight, Heart, Globe } from 'lucide-react';
import { detectLocaleFromHeader } from '@/lib/locale-detection';
import LandingLanguageSwitcher from '@/components/LandingLanguageSwitcher';

export default async function LandingPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const acceptLang = headerStore.get('accept-language');
  const locale = (cookieLocale || detectLocaleFromHeader(acceptLang)) as 'en' | 'ru';

  const t = translations[locale];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden">
      {/* Navigation */}
      <nav data-testid="landing-nav" className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <TreePine className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-semibold">Gene-Tree</span>
          </div>
          <div className="flex items-center gap-4">
            <LandingLanguageSwitcher currentLocale={locale} />
            <Link
              href={`/${locale}/sign-in`}
              data-testid="nav-sign-in"
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {t.signIn}
            </Link>
            <Link
              href={`/${locale}/sign-up`}
              data-testid="nav-get-started"
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
            >
              {t.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section data-testid="hero-section" className="relative pt-32 pb-24 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-40 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[200px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-orange-600/8 rounded-full blur-[180px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-amber-500/5 rounded-full blur-[250px]" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-zinc-400">{t.badge}</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 leading-[1.1]">
            {t.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent font-medium">
              {t.heroTitle2}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/sign-up`}
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
            >
              {t.startFree}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={`/${locale}/sign-in`}
              className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {t.signIn}
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-12 text-zinc-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>{t.trustPrivacy}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{t.trustGlobal}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>{t.trustFamilies}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section data-testid="features-section" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              {t.featuresTitle}
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-amber-500/20 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TreePine className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-medium mb-3">{t.feature1Title}</h3>
              <p className="text-zinc-400 leading-relaxed">{t.feature1Desc}</p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-amber-500/20 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-medium mb-3">{t.feature2Title}</h3>
              <p className="text-zinc-400 leading-relaxed">{t.feature2Desc}</p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-amber-500/20 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-medium mb-3">{t.feature3Title}</h3>
              <p className="text-zinc-400 leading-relaxed">{t.feature3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section data-testid="cta-section" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-3xl relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-amber-500/10 rounded-full blur-[100px]" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-light mb-4">
                {t.ctaTitle}
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto mb-8">
                {t.ctaSubtitle}
              </p>
              <Link
                href={`/${locale}/sign-up`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-xl shadow-amber-500/25"
              >
                {t.ctaButton}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <TreePine className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm text-zinc-500">© 2026 Gene-Tree. {t.footerRights}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">{t.footerPrivacy}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t.footerTerms}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t.footerContact}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const translations = {
  en: {
    signIn: 'Sign In',
    getStarted: 'Get Started',
    badge: 'Preserve your family legacy',
    heroTitle1: 'Your Family Story',
    heroTitle2: 'Lives Forever',
    heroSubtitle: 'Build a beautiful family tree, preserve precious memories with voice stories, and connect generations across time with Gene-Tree.',
    startFree: 'Start Free',
    trustPrivacy: 'Privacy-first',
    trustGlobal: 'Global families',
    trustFamilies: 'Made with love',
    featuresTitle: 'Everything you need to preserve your heritage',
    featuresSubtitle: 'Powerful tools designed for families who value their history',
    feature1Title: 'Interactive Family Tree',
    feature1Desc: 'Build and visualize your family connections with our intuitive tree builder. Add photos, dates, and stories to each profile.',
    feature2Title: 'Voice Stories',
    feature2Desc: 'Record and preserve voice memories from family members. Hear their stories in their own voice, forever.',
    feature3Title: 'Collaborative',
    feature3Desc: 'Invite family members to contribute. Everyone can add their own memories, photos, and stories.',
    ctaTitle: 'Start preserving your family legacy today',
    ctaSubtitle: 'Join thousands of families who trust Gene-Tree to keep their stories alive for future generations.',
    ctaButton: 'Create Your Tree',
    footerRights: 'All rights reserved.',
    footerPrivacy: 'Privacy',
    footerTerms: 'Terms',
    footerContact: 'Contact',
  },
  ru: {
    signIn: 'Войти',
    getStarted: 'Начать',
    badge: 'Сохраните наследие вашей семьи',
    heroTitle1: 'История вашей семьи',
    heroTitle2: 'Живёт вечно',
    heroSubtitle: 'Создайте красивое семейное древо, сохраните драгоценные воспоминания голосовыми историями и соедините поколения с Gene-Tree.',
    startFree: 'Начать бесплатно',
    trustPrivacy: 'Приватность',
    trustGlobal: 'Семьи по всему миру',
    trustFamilies: 'Сделано с любовью',
    featuresTitle: 'Всё для сохранения вашего наследия',
    featuresSubtitle: 'Мощные инструменты для семей, которые ценят свою историю',
    feature1Title: 'Интерактивное древо',
    feature1Desc: 'Создавайте и визуализируйте семейные связи с помощью удобного конструктора. Добавляйте фото, даты и истории.',
    feature2Title: 'Голосовые истории',
    feature2Desc: 'Записывайте и сохраняйте голосовые воспоминания членов семьи. Услышьте их истории их голосом навсегда.',
    feature3Title: 'Совместная работа',
    feature3Desc: 'Приглашайте родственников участвовать. Каждый может добавлять свои воспоминания, фото и истории.',
    ctaTitle: 'Начните сохранять наследие семьи сегодня',
    ctaSubtitle: 'Присоединяйтесь к тысячам семей, которые доверяют Gene-Tree хранить свои истории для будущих поколений.',
    ctaButton: 'Создать древо',
    footerRights: 'Все права защищены.',
    footerPrivacy: 'Конфиденциальность',
    footerTerms: 'Условия',
    footerContact: 'Контакты',
  },
};
