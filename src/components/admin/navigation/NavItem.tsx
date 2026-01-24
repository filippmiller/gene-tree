'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'warning' | 'error';
}

export function NavItem({ href, label, icon: Icon, badge, badgeVariant = 'default' }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            'px-2 py-0.5 text-xs font-semibold rounded-full',
            badgeVariant === 'default' && 'bg-slate-700 text-slate-300',
            badgeVariant === 'warning' && 'bg-amber-500/20 text-amber-400',
            badgeVariant === 'error' && 'bg-red-500/20 text-red-400'
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
