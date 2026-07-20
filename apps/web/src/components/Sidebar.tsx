'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  GitPullRequest,
  UserCheck,
  Wallet,
  ShieldAlert,
  Building,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '../lib/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, tenant } = useAuthStore();

  const navItems = [
    { label: 'لوحة القيادة والمؤشرات', href: '/dashboard', icon: LayoutDashboard },
    { label: 'إدارة العملاء والكيانات (CRM)', href: '/dashboard/crm', icon: Users },
    { label: 'خزينة المستندات والتجديدات', href: '/dashboard/documents', icon: FileText },
    { label: 'السجل التجاري والضرائب والتأمينات', href: '/dashboard/commercial-registers', icon: Building2 },
    { label: 'إدارة الخدمات والمسارات (Workflow)', href: '/dashboard/services', icon: GitPullRequest },
    { label: 'فريق العمل وتتبع الـ GPS الميداني', href: '/dashboard/hr-gps', icon: UserCheck },
    { label: 'الإدارة المالية والمقبوضات (Finance)', href: '/dashboard/finance', icon: Wallet },
    { label: 'سجّلات التدقيق والأمان (Audit Logs)', href: '/dashboard/audit-logs', icon: ShieldAlert },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-screen sticky top-0 z-40">
      {/* Workspace Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3 space-x-reverse">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Building className="w-5 h-5" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="text-sm font-bold text-slate-100 truncate">{tenant?.name || 'مكتب النخبة ERP'}</h2>
          <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            نظام موثق • {tenant?.subdomain}
          </span>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="mx-4 my-3 p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/50 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">الصلاحية الحالية:</span>
        <span className="px-2 py-0.5 rounded font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          {user?.role || 'OWNER'}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {navItems.map((item) => {
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
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronLeft className="w-4 h-4 text-white/80" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-sky-400 text-sm">
            {user?.name?.charAt(0) || 'أ'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.jobTitle}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
