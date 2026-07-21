'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Loader2,
  Mail,
  Minus,
  Plus,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { apiFetch, ApiRequestError } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Can } from '@/components/AuthGate';

// --- types -------------------------------------------------------------------

interface PermissionDef {
  code: string;
  groupKey: string;
  groupLabel: string;
  labelAr: string;
  description?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  jobTitle?: string | null;
  lastLoginAt?: string | null;
  overrideCount: number;
}

interface MemberDetail extends Member {
  rolePermissions: string[];
  overrides: { permissionCode: string; granted: boolean }[];
  effectivePermissions: string[];
  permissionsLocked: boolean;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  invitedBy: { name: string };
}

const ROLES = [
  { value: 'MANAGER', label: 'مدير — إدارة التشغيل' },
  { value: 'ACCOUNTANT', label: 'محاسب — المالية والتقارير' },
  { value: 'EMPLOYEE', label: 'موظف — عملاؤه ومهامه فقط' },
  { value: 'VIEWER', label: 'مراقب — قراءة فقط' },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'المالك',
  MANAGER: 'المدير',
  ACCOUNTANT: 'المحاسب',
  EMPLOYEE: 'الموظف',
  VIEWER: 'المراقب',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING_INVITATION: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  SUSPENDED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  PENDING_INVITATION: 'بانتظار قبول الدعوة',
  SUSPENDED: 'موقوف',
};

// --- page --------------------------------------------------------------------

export default function TeamPage() {
  const myPermissions = useAuthStore((s) => s.permissions);

  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<MemberDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, mem, inv] = await Promise.all([
        apiFetch<PermissionDef[]>('/permissions/catalog'),
        apiFetch<Member[]>('/team/members'),
        myPermissions.has('user.invite')
          ? apiFetch<PendingInvitation[]>('/team/invitations')
          : Promise.resolve([]),
      ]);
      setCatalog(cat);
      setMembers(mem);
      setInvitations(inv);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذر تحميل بيانات الفريق');
    } finally {
      setLoading(false);
    }
  }, [myPermissions]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPermissions(id: string) {
    try {
      setEditing(await apiFetch<MemberDetail>(`/team/members/${id}`));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذر تحميل صلاحيات الموظف');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            فريق العمل والصلاحيات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ادعُ موظفاً، حدد دوره، وامنحه أو اسحب منه صلاحيات بعينها.
          </p>
        </div>

        <Can permission="user.invite">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            دعوة موظف جديد
          </button>
        </Can>
      </header>

      {error && (
        <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-card rounded-2xl border border-slate-800 p-12 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
          <p className="text-xs text-slate-400">جارٍ التحميل…</p>
        </div>
      ) : (
        <>
          <MembersTable members={members} onEditPermissions={openPermissions} onChanged={load} />
          {invitations.length > 0 && (
            <InvitationsTable invitations={invitations} onChanged={load} />
          )}
        </>
      )}

      {inviteOpen && (
        <InviteModal
          catalog={catalog}
          onClose={() => setInviteOpen(false)}
          onDone={() => {
            setInviteOpen(false);
            void load();
          }}
        />
      )}

      {editing && (
        <PermissionsModal
          member={editing}
          catalog={catalog}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

// --- members -----------------------------------------------------------------

function MembersTable({
  members,
  onEditPermissions,
  onChanged,
}: {
  members: Member[];
  onEditPermissions: (id: string) => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function deactivate(member: Member) {
    if (!confirm(`إيقاف حساب ${member.name}؟ ستُنهى جلساته فوراً.`)) return;
    setBusy(member.id);
    try {
      await apiFetch(`/team/members/${member.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : 'تعذر إيقاف الحساب');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-bold">
        أعضاء الفريق ({members.length})
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[46rem]">
          <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
            <tr>
              <th className="p-3.5">الاسم</th>
              <th className="p-3.5">البريد الإلكتروني</th>
              <th className="p-3.5">الدور</th>
              <th className="p-3.5">الحالة</th>
              <th className="p-3.5">صلاحيات مخصصة</th>
              <th className="p-3.5">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/40">
                <td className="p-3.5">
                  <span className="font-bold text-white">{m.name}</span>
                  {m.jobTitle && (
                    <span className="block text-[10px] text-slate-400">{m.jobTitle}</span>
                  )}
                </td>
                <td className="p-3.5 text-slate-300" dir="ltr">
                  {m.email}
                </td>
                <td className="p-3.5">
                  <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-0.5 text-[10px]">
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`inline-block border rounded-md px-2 py-0.5 text-[10px] ${STATUS_STYLES[m.status] ?? ''}`}
                  >
                    {STATUS_LABELS[m.status] ?? m.status}
                  </span>
                </td>
                <td className="p-3.5">
                  {m.overrideCount > 0 ? (
                    <span className="text-amber-400">{m.overrideCount} استثناء</span>
                  ) : (
                    <span className="text-slate-500">تتبع الدور</span>
                  )}
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <Can permission="permission.manage">
                      {m.role !== 'OWNER' && (
                        <button
                          type="button"
                          onClick={() => onEditPermissions(m.id)}
                          className="bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          الصلاحيات
                        </button>
                      )}
                    </Can>
                    <Can permission="user.deactivate">
                      {m.role !== 'OWNER' && m.status !== 'SUSPENDED' && (
                        <button
                          type="button"
                          disabled={busy === m.id}
                          onClick={() => deactivate(m)}
                          className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50"
                        >
                          إيقاف
                        </button>
                      )}
                    </Can>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- pending invitations -----------------------------------------------------

function InvitationsTable({
  invitations,
  onChanged,
}: {
  invitations: PendingInvitation[];
  onChanged: () => void;
}) {
  async function revoke(id: string) {
    if (!confirm('إلغاء هذه الدعوة؟')) return;
    try {
      await apiFetch(`/team/invitations/${id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      alert(err instanceof ApiRequestError ? err.message : 'تعذر إلغاء الدعوة');
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-bold flex items-center gap-2">
        <Mail className="w-3.5 h-3.5 text-amber-400" />
        دعوات معلقة ({invitations.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[38rem]">
          <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
            <tr>
              <th className="p-3.5">البريد</th>
              <th className="p-3.5">الدور</th>
              <th className="p-3.5">دعاه</th>
              <th className="p-3.5">تنتهي في</th>
              <th className="p-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {invitations.map((i) => (
              <tr key={i.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 text-slate-200" dir="ltr">
                  {i.email}
                </td>
                <td className="p-3.5 text-slate-300">{ROLE_LABELS[i.role] ?? i.role}</td>
                <td className="p-3.5 text-slate-400">{i.invitedBy.name}</td>
                <td className="p-3.5 text-slate-400">
                  {new Date(i.expiresAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="p-3.5">
                  <button
                    type="button"
                    onClick={() => revoke(i.id)}
                    className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                  >
                    إلغاء
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- invite ------------------------------------------------------------------

function InviteModal({
  catalog,
  onClose,
  onDone,
}: {
  catalog: PermissionDef[];
  onClose: () => void;
  onDone: () => void;
}) {
  const myPermissions = useAuthStore((s) => s.permissions);

  const [form, setForm] = useState({ name: '', email: '', role: 'EMPLOYEE', jobTitle: '' });
  const [grants, setGrants] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ email: string; token: string } | null>(null);

  const groups = useMemo(() => groupPermissions(catalog), [catalog]);

  function toggle(code: string) {
    setGrants((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ email: string; invitationToken: string }>(
        '/team/invitations',
        {
          method: 'POST',
          body: JSON.stringify({ ...form, grantPermissions: [...grants] }),
        },
      );
      setIssued({ email: result.email, token: result.invitationToken });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذر إرسال الدعوة');
    } finally {
      setSubmitting(false);
    }
  }

  if (issued) {
    const link = `${window.location.origin}/invitation/${issued.token}`;
    return (
      <Modal title="تم إنشاء الدعوة" onClose={onDone}>
        <p className="text-xs text-slate-300">
          أرسل هذا الرابط إلى <span dir="ltr" className="text-sky-400">{issued.email}</span> ليضبط
          كلمة المرور ويفعّل حسابه. الرابط صالح 7 أيام.
        </p>
        <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
          الإرسال بالبريد يأتي مع وحدة التنبيهات. حتى ذلك الحين انسخ الرابط يدوياً — يظهر مرة واحدة
          فقط ولا يمكن استرجاعه لاحقاً.
        </p>
        <CopyField value={link} />
      </Modal>
    );
  }

  return (
    <Modal title="دعوة موظف جديد" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <Field label="اسم الموظف *">
            <input
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={INPUT}
              placeholder="مثال: محمد أحمد"
            />
          </Field>
          <Field label="البريد الإلكتروني *">
            <input
              required
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`${INPUT} text-left`}
              placeholder="employee@example.com"
            />
          </Field>
          <Field label="الدور الوظيفي *">
            <select
              required
              value={form.role}
              onChange={(e) => {
                setForm({ ...form, role: e.target.value });
                setGrants(new Set());
              }}
              className={INPUT}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المسمى الوظيفي">
            <input
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className={INPUT}
              placeholder="أخصائي خدمات"
            />
          </Field>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-300 mb-1">صلاحيات إضافية (اختياري)</p>
          <p className="text-[11px] text-slate-500 mb-3">
            الدور يمنح صلاحياته الأساسية تلقائياً. اختر هنا ما تريد إضافته فوقها فقط.
          </p>

          <div className="max-h-64 overflow-y-auto flex flex-col gap-3 pl-1">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="text-[11px] font-bold text-slate-400 mb-1.5">{group.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.items.map((p) => {
                    // You cannot hand out what you do not hold; the API enforces
                    // this too, but showing it disabled explains why.
                    const allowed = myPermissions.has(p.code);
                    return (
                      <label
                        key={p.code}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border text-[11px] transition-colors ${
                          allowed
                            ? 'bg-slate-800/60 border-slate-700 cursor-pointer hover:border-sky-600'
                            : 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed'
                        }`}
                        title={allowed ? p.description : 'لا تملك هذه الصلاحية لتمنحها'}
                      >
                        <input
                          type="checkbox"
                          disabled={!allowed}
                          checked={grants.has(p.code)}
                          onChange={() => toggle(p.code)}
                          className="accent-sky-500"
                        />
                        <span className="text-slate-200">{p.labelAr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            إلغاء
          </button>
          <button type="submit" disabled={submitting} className={BTN_PRIMARY}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            إنشاء الدعوة
          </button>
        </div>
      </form>
    </Modal>
  );
}

// --- per-user permissions ----------------------------------------------------

function PermissionsModal({
  member,
  catalog,
  onClose,
  onDone,
}: {
  member: MemberDetail;
  catalog: PermissionDef[];
  onClose: () => void;
  onDone: () => void;
}) {
  const myPermissions = useAuthStore((s) => s.permissions);
  const fromRole = useMemo(() => new Set(member.rolePermissions), [member.rolePermissions]);

  const [effective, setEffective] = useState<Set<string>>(
    () => new Set(member.effectivePermissions),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => groupPermissions(catalog), [catalog]);

  function toggle(code: string) {
    setEffective((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  // Only differences from the role are sent; anything matching the role stays
  // tied to it, so narrowing the role later still narrows this person.
  const overrides = useMemo(
    () =>
      catalog
        .filter((p) => effective.has(p.code) !== fromRole.has(p.code))
        .map((p) => ({ code: p.code, granted: effective.has(p.code) })),
    [catalog, effective, fromRole],
  );

  async function save() {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/team/members/${member.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ overrides }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذر حفظ الصلاحيات');
    } finally {
      setSubmitting(false);
    }
  }

  const added = overrides.filter((o) => o.granted).length;
  const removed = overrides.length - added;

  return (
    <Modal title={`صلاحيات ${member.name}`} onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-1">
            الدور: {ROLE_LABELS[member.role] ?? member.role}
          </span>
          <span className="bg-slate-800 text-slate-300 border border-slate-700 rounded-md px-2 py-1">
            {effective.size} صلاحية فعّالة
          </span>
          {added > 0 && (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md px-2 py-1 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              {added} إضافة
            </span>
          )}
          {removed > 0 && (
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md px-2 py-1 flex items-center gap-1">
              <Minus className="w-3 h-3" />
              {removed} سحب
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto flex flex-col gap-4 pl-1">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-[11px] font-bold text-slate-400 mb-1.5">{group.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.items.map((p) => {
                  const checked = effective.has(p.code);
                  const inRole = fromRole.has(p.code);
                  const differs = checked !== inRole;
                  const allowed = myPermissions.has(p.code) || inRole;

                  return (
                    <label
                      key={p.code}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 border text-[11px] transition-colors ${
                        !allowed
                          ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed'
                          : differs
                            ? checked
                              ? 'bg-emerald-500/10 border-emerald-500/30 cursor-pointer'
                              : 'bg-rose-500/10 border-rose-500/30 cursor-pointer'
                            : 'bg-slate-800/60 border-slate-700 cursor-pointer hover:border-sky-600'
                      }`}
                      title={p.description}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!allowed}
                          checked={checked}
                          onChange={() => toggle(p.code)}
                          className="accent-sky-500"
                        />
                        <span className="text-slate-200">{p.labelAr}</span>
                      </span>
                      {inRole && (
                        <span className="text-[9px] text-slate-500 shrink-0">من الدور</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            إلغاء
          </button>
          <button type="button" onClick={save} disabled={submitting} className={BTN_PRIMARY}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            حفظ الصلاحيات
          </button>
        </div>
      </div>
    </Modal>
  );
}

// --- shared ------------------------------------------------------------------

const INPUT =
  'w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent';
const BTN_PRIMARY =
  'bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 transition-colors';
const BTN_SECONDARY =
  'bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl px-4 py-2.5 transition-colors';

function groupPermissions(catalog: PermissionDef[]) {
  const map = new Map<string, { key: string; label: string; items: PermissionDef[] }>();
  for (const p of catalog) {
    if (!map.has(p.groupKey)) {
      map.set(p.groupKey, { key: p.groupKey, label: p.groupLabel, items: [] });
    }
    map.get(p.groupKey)!.items.push(p);
  }
  return [...map.values()];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-slate-300 mb-1 font-bold">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className={`glass-card w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        dir="ltr"
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className={`${INPUT} text-left text-[11px]`}
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={BTN_PRIMARY}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'تم النسخ' : 'نسخ'}
      </button>
    </div>
  );
}
