import { Suspense } from 'react';
import { getSupabaseSSR } from '@/lib/supabase/server-ssr';
import { redirect } from 'next/navigation';
import { BookBuilder } from '@/components/memory-book';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Memory Book | Gene Tree',
  description: 'Create a beautiful PDF memory book from your family stories and photos',
};

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Step indicator skeleton */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-16 h-3 mt-2" />
            </div>
            {i < 5 && <Skeleton className="w-24 h-0.5 mx-2" />}
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="w-full h-96 rounded-lg" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="w-full aspect-[3/4] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default async function MemoryBookPage() {
  const supabase = await getSupabaseSSR();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D29922] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Memory Book</h1>
              <p className="text-muted-foreground">
                Create a beautiful printable book from your family memories
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              'Professional PDF layout',
              'Multiple themes',
              'Include stories & photos',
              'Print-ready quality',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#D29922]/10 rounded-full text-sm text-[#D29922]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <Suspense fallback={<LoadingSkeleton />}>
          <BookBuilder />
        </Suspense>
      </div>
    </div>
  );
}
