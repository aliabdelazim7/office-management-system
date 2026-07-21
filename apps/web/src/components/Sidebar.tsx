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
  UserCog,
  Wallet,
  X,
} from 'lucide-react';
import { useAuthStore } from '../lib/store';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'المالك',
  MANAGER: 'المدير',
  ACCOUNTANT: 'المحاسب',
  EMPLOYEE: 'الموظف',
  VIEWER: 'المراقب',
};

const NAV_ITEMS: Array<{ label: string; href: string; icon: typeof Users; permission?: string }> = [
  { label: 'لوحة القيادة والمؤشرات', href: '/dashboard', icon: LayoutDashboard },
  { label: 'إدارة المستخدمين والحسابات', href: '/dashboard/team', icon: UserCog, permission: 'user.read' },
  { label: 'إدارة العملاء والكيانات (CRM)', href: '/dashboard/crm', icon: Users, permission: 'crm.read' },
  { label: 'خزينة المستندات والتجديدات', href: '/dashboard/documents', icon: FileText, permission: 'doc.read' },
  { label: 'السجل التجاري والضرائب والتأمينات', href: '/dashboard/commercial-registers', icon: Building2, permission: 'crm.read' },
  { label: 'إدارة الخدمات والمسارات', href: '/dashboard/services', icon: GitPullRequest, permission: 'service.read' },
  { label: 'المهام الميدانية وتتبع GPS', href: '/dashboard/hr-gps', icon: UserCheck, permission: 'field.read' },
  { label: 'الإدارة المالية والمقبوضات', href: '/dashboard/finance', icon: Wallet, permission: 'finance.read' },
  { label: 'سجلات التدقيق والأمان', href: '/dashboard/audit-logs', icon: ShieldAlert, permission: 'audit.read' },
];

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user, can } = useAuthStore();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || user?.role === 'OWNER' || can(item.permission)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] text-[var(--text-primary)] border-l border-[var(--sidebar-border)] transition-colors">
      <div className="p-4 sm:p-5 border-b border-[var(--sidebar-border)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-subtle-sm shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">{user?.tenant.name ?? '—'}</h2>
            <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate" dir="ltr">
                {user?.tenant.slug}
              </span>
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-canvas)] transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mx-4 my-3 p-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--sidebar-border)] flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)] font-medium text-[11px]">الدور الحالي:</span>
        <span className="px-2 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px]">
          {ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 scrollbar-thin">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-subtle-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronLeft className="w-3.5 h-3.5 text-white/80 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--sidebar-border)] bg-[var(--bg-canvas)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">
            {user?.name?.trim().charAt(0) ?? '—'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {user?.jobTitle ?? 'كامل الصلاحيات (المالك)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[var(--sidebar-bg)] border-l border-[var(--sidebar-border)] flex-col h-screen sticky top-0 z-40 shrink-0 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-80 max-w-[85vw] bg-[var(--sidebar-bg)] h-full border-l border-[var(--sidebar-border)] shadow-subtle-lg flex flex-col z-50 mr-auto transition-colors">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
