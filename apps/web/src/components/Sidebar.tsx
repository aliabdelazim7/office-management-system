'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building,
  Building2,
  CheckCircle2,
  ChevronLeft,
  FileText,
  GitPullRequest,
  LayoutDashboard,
  ShieldAlert,
  UserCheck,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../lib/store';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'المالك',
  MANAGER: 'المدير',
  ACCOUNTANT: 'المحاسب',
  EMPLOYEE: 'الموظف',
  VIEWER: 'المراقب',
};

/**
 * Codes must match packages/database/src/permissions.ts exactly.
 *
 * They briefly did not — the list used `crm.read`, `doc.read`, `user.read` and
 * friends, none of which exist in the catalogue. Every check failed, and the
 * only reason the sidebar still rendered was an `role === 'OWNER'` escape hatch
 * that hid the breakage for the one role that could not notice it. Everyone
 * else saw an empty sidebar.
 */
const NAV_ITEMS: Array<{ label: string; href: string; icon: typeof Users; permission?: string }> = [
  { label: 'لوحة القيادة والمؤشرات', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'إدارة العملاء والكيانات (CRM)', href: '/dashboard/crm', icon: Users, permission: 'client.view' },
  { label: 'خزينة المستندات والتجديدات', href: '/dashboard/documents', icon: FileText, permission: 'document.view' },
  { label: 'السجل التجاري والضرائب والتأمينات', href: '/dashboard/commercial-registers', icon: Building2, permission: 'gov.view' },
  { label: 'إدارة الخدمات والمسارات', href: '/dashboard/services', icon: GitPullRequest, permission: 'service.view' },
  { label: 'فريق العمل والصلاحيات', href: '/dashboard/team', icon: UsersRound, permission: 'user.view' },
  { label: 'المهام الميدانية وتتبع GPS', href: '/dashboard/hr-gps', icon: UserCheck, permission: 'field.view_own' },
  { label: 'الإدارة المالية والمقبوضات', href: '/dashboard/finance', icon: Wallet, permission: 'invoice.view' },
  { label: 'سجلات التدقيق والأمان', href: '/dashboard/audit-logs', icon: ShieldAlert, permission: 'audit.view' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, can } = useAuthStore();

  // No role special-case: the server already gives OWNER every permission.
  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || can(item.permission));

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-screen sticky top-0 z-40">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
          <Building className="w-5 h-5" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="text-sm font-bold text-slate-100 truncate">{user?.tenant.name ?? '—'}</h2>
          <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate" dir="ltr">
              {user?.tenant.slug}
            </span>
          </span>
        </div>
      </div>

      <div className="mx-4 my-3 p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/50 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">الدور الحالي:</span>
        <span className="px-2 py-0.5 rounded font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          {ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronLeft className="w-4 h-4 text-white/80 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-sky-400 text-sm shrink-0">
            {user?.name?.trim().charAt(0) ?? '—'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {user?.jobTitle ?? 'كامل الصلاحيات (المالك)'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
