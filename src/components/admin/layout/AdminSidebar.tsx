'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Shield,
  FileText,
  Image,
  MessageSquare,
  Database,
  Table2,
  GitBranch,
  Settings,
  ScrollText,
  Activity,
  Bell,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { NavSection, NavItem } from '../navigation';

interface AdminSidebarProps {
  adminName: string;
}

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const basePath = `/${locale}/admin`;

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col border-r border-slate-800">
      {/* Logo / Brand */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-semibold">Gene Tree</h1>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Overview */}
        <NavSection title="Overview">
          <NavItem
            href={`${basePath}`}
            label="Dashboard"
            icon={LayoutDashboard}
          />
          <NavItem
            href={`${basePath}/activity`}
            label="Activity Log"
            icon={Activity}
          />
        </NavSection>

        {/* User Management */}
        <NavSection title="Users">
          <NavItem
            href={`${basePath}/users`}
            label="All Users"
            icon={Users}
          />
          <NavItem
            href={`${basePath}/roles`}
            label="Roles & Permissions"
            icon={UserCog}
          />
          <NavItem
            href={`${basePath}/invites`}
            label="Invitations"
            icon={Bell}
          />
        </NavSection>

        {/* Content Management */}
        <NavSection title="Content">
          <NavItem
            href={`${basePath}/stories`}
            label="Stories"
            icon={FileText}
          />
          <NavItem
            href={`${basePath}/photos`}
            label="Photos"
            icon={Image}
          />
          <NavItem
            href={`${basePath}/questions`}
            label="Elder Questions"
            icon={MessageSquare}
          />
        </NavSection>

        {/* Data Management */}
        <NavSection title="Data">
          <NavItem
            href={`${basePath}/db-explorer`}
            label="Database Explorer"
            icon={Database}
          />
          <NavItem
            href={`${basePath}/relationships`}
            label="Relationships"
            icon={GitBranch}
          />
          <NavItem
            href={`${basePath}/tables`}
            label="Reference Tables"
            icon={Table2}
          />
        </NavSection>

        {/* System */}
        <NavSection title="System">
          <NavItem
            href={`${basePath}/librarian`}
            label="Knowledge Base"
            icon={BookOpen}
          />
          <NavItem
            href={`${basePath}/audit`}
            label="Audit Logs"
            icon={ScrollText}
          />
          <NavItem
            href={`${basePath}/settings`}
            label="Settings"
            icon={Settings}
          />
          <NavItem
            href={`${basePath}/help`}
            label="Help & Docs"
            icon={HelpCircle}
          />
        </NavSection>
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{adminName}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
        <Link
          href={`/${locale}/app`}
          className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>← Back to App</span>
        </Link>
      </div>
    </aside>
  );
}
