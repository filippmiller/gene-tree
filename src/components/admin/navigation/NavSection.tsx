'use client';

import { ReactNode } from 'react';

interface NavSectionProps {
  title: string;
  children: ReactNode;
}

export function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </h3>
      <nav className="space-y-0.5">
        {children}
      </nav>
    </div>
  );
}
