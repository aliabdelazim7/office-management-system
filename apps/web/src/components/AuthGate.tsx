'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

/**
 * Blocks the dashboard until the server confirms a session.
 *
 * This is convenience, not security: it stops a signed-out person from seeing
 * an empty shell. Every screen behind it still gets its data from an API that
 * checks the token and the permission on every request, because anything
 * enforced only in the browser is enforced nowhere.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, restore } = useAuthStore();

  useEffect(() => {
    if (status === 'unknown') void restore();
  }, [status, restore]);

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-900">
        <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
        <p className="text-xs text-slate-400">جارٍ التحقق من الجلسة…</p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Renders children only when the session holds the permission. */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const can = useAuthStore((s) => s.permissions.has(permission));
  return <>{can ? children : fallback}</>;
}
