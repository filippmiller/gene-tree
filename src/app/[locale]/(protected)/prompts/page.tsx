import { getTranslations } from 'next-intl/server';
import { MemoryPromptsList } from '@/components/prompts';
import { GlassCard } from '@/components/ui/glass-card';
import { MessageCircle, BookOpen, Sparkles } from 'lucide-react';

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prompts' });

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* Hero Section */}
        <GlassCard glass="frosted" padding="none" className="overflow-hidden">
          <div className="relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-700" />
            {/* Decorative elements */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-8 top-8 text-white/10">
              <MessageCircle className="w-20 h-20" />
            </div>

            <div className="relative p-6 sm:p-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      {locale === 'ru' ? 'Вопросы для воспоминаний' : 'Memory Prompts'}
                    </h1>
                    <p className="text-white/80 text-sm">
                      {locale === 'ru'
                        ? 'Вдохновение для семейных историй'
                        : 'Inspiration for family stories'}
                    </p>
                  </div>
                </div>
                <p className="text-white/90 text-base leading-relaxed">
                  {locale === 'ru'
                    ? 'Эти вопросы помогут вам записать важные семейные воспоминания. Отвечайте на них, когда есть время, и создавайте истории, которые сохранят семейное наследие для будущих поколений.'
                    : 'These prompts help you record important family memories. Answer them when you have time, and create stories that preserve your family heritage for future generations.'}
                </p>

                {/* Tips */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white/90 text-sm">
                    <Sparkles className="w-4 h-4" />
                    {locale === 'ru' ? 'Новые вопросы каждый день' : 'New prompts daily'}
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-white/90 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    {locale === 'ru' ? '25+ вопросов' : '25+ prompts'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Prompts List */}
        <MemoryPromptsList />
      </main>
    </div>
  );
}
