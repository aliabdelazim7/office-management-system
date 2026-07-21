'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { AuthGate } from '@/components/AuthGate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthGate>
      <div className="flex min-h-screen bg-slate-900 text-slate-100 overflow-x-hidden">
        <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen((v) => !v)} />
          <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto max-w-full">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
