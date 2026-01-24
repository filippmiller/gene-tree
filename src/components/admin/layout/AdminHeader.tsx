'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

// Map paths to page titles
function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  const titles: Record<string, string> = {
    admin: 'Dashboard',
    'db-explorer': 'Database Explorer',
    users: 'User Management',
    roles: 'Roles & Permissions',
    invites: 'Invitations',
    stories: 'Stories',
    photos: 'Photos',
    questions: 'Elder Questions',
    relationships: 'Relationships',
    tables: 'Reference Tables',
    librarian: 'Knowledge Base',
    audit: 'Audit Logs',
    settings: 'Settings',
    help: 'Help & Documentation',
    activity: 'Activity Log',
  };

  return titles[lastSegment] || 'Admin';
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {pageTitle}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 w-64 bg-slate-100 dark:bg-slate-800 border-0"
            />
          </div>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
