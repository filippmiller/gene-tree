import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Family Tree',
  description: 'Genealogical tree application',
};

export default function RootLayout({children}:{children: React.ReactNode}) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
