import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gene-tree-production.up.railway.app';

export const metadata: Metadata = {
  title: {
    default: 'Gene Tree — Preserve Your Family Legacy',
    template: '%s | Gene Tree',
  },
  description:
    'A privacy-first platform to build your family tree, preserve stories, and connect generations. Record voice memories, share photos, and keep your heritage alive.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    siteName: 'Gene Tree',
    title: 'Gene Tree — Preserve Your Family Legacy',
    description:
      'Build your family tree, record voice stories, share photos, and connect with relatives. Privacy-first, culturally aware genealogy for modern families.',
    locale: 'en_US',
    alternateLocale: ['ru_RU'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gene Tree — Preserve Your Family Legacy',
    description:
      'A privacy-first genealogy platform for modern families. Build trees, record stories, connect generations.',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'apple-mobile-web-app-title': 'Gene Tree',
  },
};

export default function RootLayout({children}:{children: React.ReactNode}) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
