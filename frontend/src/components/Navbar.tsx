'use client';

import React, { useState } from 'react';
import { Search, Bell, Shield, UserCheck, CheckCircle, Smartphone } from 'lucide-react';
import { useAuthStore } from '../lib/store';
import { UserRole } from '../lib/types';
import { API_BASE_URL } from '../lib/api';

export default function Navbar() {
  const { user, switchDemoRole } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: 'Bearer demo-jwt-token-active-session' },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.log('Search fetch fallback');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="h-16 glass-header sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Global Search Bar */}
      <div className="relative w-96">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="بحث شامل (اسم العميل، السجل، الضرائب، الفواتير)..."
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Global Search Popup Results */}
        {searchResults && (
          <div className="absolute top-12 right-0 w-[480px] bg-slate-850 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-xs space-y-3 max-h-96 overflow-y-auto">
            <h4 className="font-bold text-sky-400 border-b border-slate-700 pb-2">نتائج البحث الشامل عن: "{searchQuery}"</h4>

            {searchResults.clients?.length > 0 && (
              <div>
                <p className="font-bold text-slate-300 mb-1">العملاء والشركات ({searchResults.clients.length}):</p>
                {searchResults.clients.map((c: any) => (
                  <div key={c.id} className="p-2 rounded bg-slate-800 hover:bg-slate-750 flex justify-between mb-1">
                    <span className="font-semibold text-slate-200">{c.name} ({c.companyName})</span>
                    <span className="text-sky-400">{c.clientCode}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.commercialRegisters?.length > 0 && (
              <div>
                <p className="font-bold text-slate-300 mb-1">السجلات التجارية ({searchResults.commercialRegisters.length}):</p>
                {searchResults.commercialRegisters.map((cr: any) => (
                  <div key={cr.id} className="p-2 rounded bg-slate-800 mb-1 flex justify-between">
                    <span>{cr.tradeName}</span>
                    <span className="text-emerald-400">سجل #{cr.registerNumber}</span>
                  </div>
                ))}
              </div>
            )}

            {searchResults.clients?.length === 0 && searchResults.commercialRegisters?.length === 0 && (
              <p className="text-slate-400 text-center py-4">لم يتم العثور على نتائج تطابق البحث.</p>
            )}
          </div>
        )}
      </div>

      {/* Role Switcher & Header Controls */}
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* Live RBAC Role Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300 font-medium hidden md:inline">تبديل الدور للتجربة:</span>
          <select
            value={user?.role || UserRole.OWNER}
            onChange={(e) => switchDemoRole(e.target.value as UserRole)}
            className="bg-slate-900 border border-slate-700 text-sky-400 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value={UserRole.OWNER}>👑 Owner (المالك)</option>
            <option value={UserRole.MANAGER}>💼 Manager (المدير)</option>
            <option value={UserRole.ACCOUNTANT}>💰 Accountant (المحاسب)</option>
            <option value={UserRole.EMPLOYEE}>📍 Employee (المندوب)</option>
            <option value={UserRole.VIEWER}>👁️ Viewer (المراقب)</option>
          </select>
        </div>

        {/* Expiry Bell Alerts */}
        <button className="relative p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition">
          <Bell className="w-4 h-4 text-sky-400" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            2
          </span>
        </button>

        {/* Mobile PWA Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Smartphone className="w-3.5 h-3.5" />
          <span>PWA Ready</span>
        </div>
      </div>
    </header>
  );
}
