'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Check, Eye, EyeOff, Loader2, TriangleAlert } from 'lucide-react';
import { apiFetch, ApiRequestError } from '@/lib/api';

interface InvitationInfo {
  email: string;
  role: string;
  expiresAt: string;
  tenant: { name: string; slug: string };
}

const ROLE_LABELS: Record<string, string> = {
  MANAGER: 'مدير',
  ACCOUNTANT: 'محاسب',
  EMPLOYEE: 'موظف',
  VIEWER: 'مراقب',
};

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiFetch<InvitationInfo>(`/invitations/${token}`, { skipAuth: true })
      .then(setInfo)
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : 'تعذر التحقق من الدعوة'),
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/invitations/accept', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذر تفعيل الحساب');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Building className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-white">تفعيل الحساب</h1>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
              <p className="text-xs text-slate-400">جارٍ التحقق من الدعوة…</p>
            </div>
          )}

          {!loading && done && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white">تم تفعيل حسابك</p>
              <p className="text-xs text-slate-400">جارٍ تحويلك لصفحة الدخول…</p>
            </div>
          )}

          {!loading && !done && error && !info && (
            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs">
              <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !done && info && (
            <>
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 text-xs flex flex-col gap-1">
                <p className="text-slate-400">
                  دُعيت للانضمام إلى <span className="text-sky-400 font-bold">{info.tenant.name}</span>
                </p>
                <p className="text-slate-300" dir="ltr">
                  {info.email}
                </p>
                <p className="text-slate-400">
                  بدور: <span className="text-indigo-400">{ROLE_LABELS[info.role] ?? info.role}</span>
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs">
                  <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} className="flex flex-col gap-4">
                <label className="block">
                  <span className="block text-slate-300 mb-1.5 text-xs font-bold">
                    كلمة المرور
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={10}
                      dir="ltr"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 pl-11 text-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      aria-label={showPassword ? 'إخفاء' : 'إظهار'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="block text-[10px] text-slate-500 mt-1.5">
                    10 أحرف على الأقل، وتحتوي حرفاً كبيراً وصغيراً ورقماً
                  </span>
                </label>

                <label className="block">
                  <span className="block text-slate-300 mb-1.5 text-xs font-bold">
                    تأكيد كلمة المرور
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جارٍ التفعيل…
                    </>
                  ) : (
                    'تفعيل الحساب'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
