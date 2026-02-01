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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Memory Book</h1>
              <p className="text-gray-600">
                Create a beautiful printable book from your family memories
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              'Professional PDF layout',
              'Multiple themes',
              'Include stories & photos',
              'Print-ready quality',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full text-sm text-amber-800"
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
