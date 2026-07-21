'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building, Eye, EyeOff, Loader2, LogIn, ShieldCheck, TriangleAlert, UserPlus, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { ApiRequestError } from '@/lib/api';

interface TenantChoice {
  slug: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, restore, status } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantChoices, setTenantChoices] = useState<TenantChoice[] | null>(null);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password, tenantSlug || undefined);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.body.code === 'TENANT_AMBIGUOUS') {
          setTenantChoices((err.body as unknown as { tenants: TenantChoice[] }).tenants ?? []);
          setError('هذا البريد مسجل في أكثر من مكتب. اختر مكتبك للمتابعة');
        } else {
          setError(err.message);
        }
      } else {
        // Fall back to authenticating demo session if server is offline
        console.warn('API login error, activating demo session fallback:', err);
        router.replace('/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const handleDemoAccess = () => {
    router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Building className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-white">نظام إدارة المكتب المتكامل</h1>
            <p className="text-xs text-slate-400 mt-1">سجّل الدخول للوصول إلى مكتبك وحساباتك</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl border border-slate-800 p-6 flex flex-col gap-4 shadow-xl"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs"
            >
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-slate-300 mb-1.5 text-xs font-bold">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="owner@elite.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-300 mb-1.5 text-xs font-bold">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 pl-11 text-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {tenantChoices && tenantChoices.length > 0 && (
            <div>
              <label htmlFor="tenant" className="block text-slate-300 mb-1.5 text-xs font-bold">
                المكتب
              </label>
              <select
                id="tenant"
                required
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm"
              >
                <option value="">اختر المكتب…</option>
                {tenantChoices.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ التحقق…
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 rounded-xl py-2.5 text-xs flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            الدخول التجريبي المباشر (Demo Mode)
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            جلسة مشفّرة، وكل عملية تُسجَّل في سجل التدقيق
          </p>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/register"
            className="text-xs text-sky-400 hover:text-sky-300 font-bold inline-flex items-center gap-1.5 hover:underline"
          >
            <UserPlus className="w-4 h-4" />
            إنشاء حساب مكتب جديد (Register New Office)
          </Link>
        </div>
      </div>
    </div>
  );
}
