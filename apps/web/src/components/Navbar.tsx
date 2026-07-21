'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, Search, ShieldCheck, User } from 'lucide-react';
import { useAuthStore } from '../lib/store';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'المالك',
  MANAGER: 'المدير',
  ACCOUNTANT: 'المحاسب',
  EMPLOYEE: 'الموظف',
  VIEWER: 'المراقب',
};

export default function Navbar({ onToggleMobileSidebar }: { onToggleMobileSidebar?: () => void }) {
  const router = useRouter();
  const { user, permissions, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="h-16 sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-3 border-b border-[#222733] bg-[#101418]/90 backdrop-blur-md">
      <div className="flex items-center gap-2.5 flex-1 max-w-full">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-[#14181f] border border-[#222733] text-slate-200 hover:text-white transition-colors shrink-0"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5 text-indigo-400" />
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            disabled
            className="w-full bg-[#14181f] border border-[#222733] rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 disabled:opacity-60 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="البحث الشامل في المنظومة…"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#14181f] border border-[#222733] rounded-lg px-2.5 py-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          {permissions.size} صلاحية
        </span>

        <button
          type="button"
          disabled
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-60"
          aria-label="التنبيهات"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#14181f] transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-subtle-xs">
              {user?.name?.trim().charAt(0) ?? <User className="w-4 h-4" />}
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white leading-tight max-w-[9rem] truncate">
                {user?.name ?? '—'}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
              </p>
            </div>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute top-12 left-0 w-60 bg-[#14181f] border border-[#222733] rounded-xl shadow-subtle-lg overflow-hidden z-50"
            >
              <div className="p-3.5 border-b border-[#222733]">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate" dir="ltr">
                  {user?.email}
                </p>
                <p className="text-[10px] text-indigo-400 font-medium mt-1.5">{user?.tenant.name}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-3 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
