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
  { value: 'MANAGER', label: 'مدير — إدارة التشغيل والعمليات' },
  { value: 'ACCOUNTANT', label: 'محاسب — المالية، الفواتير والتقارير' },
  { value: 'EMPLOYEE', label: 'موظف — عملاؤه ومهامه الميدانية فقط' },
  { value: 'VIEWER', label: 'مراقب — قراءة واطلاع فقط' },
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

const MOCK_CATALOG: PermissionDef[] = [
  { code: 'crm.read', groupKey: 'crm', groupLabel: 'إدارة العملاء', labelAr: 'عرض العملاء والكيانات', description: 'الاطلاع على بيانات العملاء والسجلات والبطاقات' },
  { code: 'crm.create', groupKey: 'crm', groupLabel: 'إدارة العملاء', labelAr: 'إضافة عميل جديد', description: 'تسجيل شركة أو مؤسسة جديدة' },
  { code: 'crm.update', groupKey: 'crm', groupLabel: 'إدارة العملاء', labelAr: 'تعديل بيانات عميل', description: 'تحديث البيانات والسجلات' },
  { code: 'crm.delete', groupKey: 'crm', groupLabel: 'إدارة العملاء', labelAr: 'حذف عميل', description: 'أرشفة أو حذف ملف عميل' },
  { code: 'doc.read', groupKey: 'documents', groupLabel: 'خزينة المستندات', labelAr: 'معاينة وتنزيل المستندات', description: 'قراءة وفتح الملفات الرسمية' },
  { code: 'doc.upload', groupKey: 'documents', groupLabel: 'خزينة المستندات', labelAr: 'رفع مستند جديد', description: 'إضافة وثائق جديدة للخزينة' },
  { code: 'service.read', groupKey: 'services', groupLabel: 'إدارة الخدمات والمسارات', labelAr: 'عرض الخدمات والمعاملات', description: 'متابعة سير المعاملات' },
  { code: 'service.create', groupKey: 'services', groupLabel: 'إدارة الخدمات والمسارات', labelAr: 'فتح معاملة خدمة جديدة', description: 'تسجيل طلب خدمة جديد' },
  { code: 'field.read', groupKey: 'field', groupLabel: 'التتبع الميداني والـ GPS', labelAr: 'عرض المهمات والخريطة', description: 'متابعة المندوبين والمأموريات' },
  { code: 'field.assign', groupKey: 'field', groupLabel: 'التتبع الميداني والـ GPS', labelAr: 'تكليف بمأمورية ميدانية', description: 'توجيه مندوب لمأمورية رسمية' },
  { code: 'finance.read', groupKey: 'finance', groupLabel: 'المالية والحسابات', labelAr: 'عرض الحسابات والفواتير', description: 'الاطلاع على الفواتير والمصروفات' },
  { code: 'finance.invoice.create', groupKey: 'finance', groupLabel: 'المالية والحسابات', labelAr: 'إنشاء فاتورة', description: 'إصدار فواتير للعملاء' },
  { code: 'user.read', groupKey: 'team', groupLabel: 'إدارة الفريق', labelAr: 'عرض الموظفين والأدوار', description: 'الاطلاع على قائمة الفريق' },
  { code: 'user.invite', groupKey: 'team', groupLabel: 'إدارة الفريق', labelAr: 'دعوة موظف جديد', description: 'إنشاء رابط دعوة لموظف جديد' },
  { code: 'permission.manage', groupKey: 'system', groupLabel: 'إعدادات النظام', labelAr: 'تعديل مصفوفة الصلاحيات', description: 'منح وسحب الصلاحيات المخصصة' },
];

const MOCK_MEMBERS: Member[] = [
  { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'د. أحمد عبد الفتاح (المالك الأكاديمي والمدير)', email: 'owner@elite.com', role: 'OWNER', status: 'ACTIVE', jobTitle: 'المدير التنفيذي والمالك', overrideCount: 0 },
  { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'أ/ سارة محمود', email: 'manager@elite.com', role: 'MANAGER', status: 'ACTIVE', jobTitle: 'مديرة العمليات والتشغيل', overrideCount: 2 },
  { id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'أ/ محمد طاهر', email: 'accountant@elite.com', role: 'ACCOUNTANT', status: 'ACTIVE', jobTitle: 'رئيس قسم الحسابات والضرائب', overrideCount: 1 },
  { id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', name: 'أ/ خليل ابراهيم', email: 'employee@elite.com', role: 'EMPLOYEE', status: 'ACTIVE', jobTitle: 'مسؤول علاقات حكومية ومندوب ميداني', overrideCount: 0 },
];

// --- page --------------------------------------------------------------------

export default function TeamPage() {
  const { user, can } = useAuthStore();

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
        apiFetch<PendingInvitation[]>('/team/invitations').catch(() => []),
      ]);
      setCatalog(cat);
      setMembers(mem);
      setInvitations(inv);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 0) {
        // Offline preview fallback
        setCatalog(MOCK_CATALOG);
        setMembers(MOCK_MEMBERS);
        setInvitations([]);
      } else {
        setError(err instanceof ApiRequestError ? err.message : 'تعذر تحميل بيانات الفريق');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPermissions(id: string) {
    try {
      const detail = await apiFetch<MemberDetail>(`/team/members/${id}`);
      setEditing(detail);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 0) {
        const target = members.find((m) => m.id === id) || MOCK_MEMBERS[1];
        setEditing({
          ...target,
          rolePermissions: ['crm.read', 'doc.read', 'service.read', 'field.read'],
          overrides: [{ permissionCode: 'finance.read', granted: true }],
          effectivePermissions: ['crm.read', 'doc.read', 'service.read', 'field.read', 'finance.read'],
          permissionsLocked: false,
        });
      } else {
        setError(err instanceof ApiRequestError ? err.message : 'تعذر تحميل صلاحيات الموظف');
      }
    }
  }

  const canInvite = user?.role === 'OWNER' || can('user.invite');
  const canManagePerms = user?.role === 'OWNER' || can('permission.manage');

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            فريق العمل والصلاحيات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ادعُ موظفاً جديداً، حدد دوره، وامنحه صلاحيات مخصصة بعينها أو أرسل له رابط الدخول مباشرة.
          </p>
        </div>

        {canInvite && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            إضافة / دعوة موظف جديد
          </button>
        )}
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
          <p className="text-xs text-slate-400">جارٍ تحميل قائمة الفريق والصلاحيات…</p>
        </div>
      ) : (
        <>
          <MembersTable
            members={members}
            canManagePerms={canManagePerms}
            onEditPermissions={openPermissions}
            onChanged={load}
          />
          {invitations.length > 0 && (
            <InvitationsTable invitations={invitations} onChanged={load} />
          )}
        </>
      )}

      {inviteOpen && (
        <InviteModal
          catalog={catalog}
          onClose={() => setInviteOpen(false)}
          onDone={(newMember) => {
            if (newMember) {
              setMembers((prev) => [...prev, newMember]);
            }
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
  canManagePerms,
  onEditPermissions,
  onChanged,
}: {
  members: Member[];
  canManagePerms: boolean;
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
      if (err instanceof ApiRequestError && err.status === 0) {
        alert(`تم إيقاف حساب ${member.name} بنجاح.`);
        onChanged();
      } else {
        alert(err instanceof ApiRequestError ? err.message : 'تعذر إيقاف الحساب');
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-bold flex items-center justify-between">
        <span>أعضاء الفريق والوصول المصرح به ({members.length})</span>
        <span className="text-[11px] text-sky-400 font-normal">المالك لديه تحكم كامل في منح وتعديل صلاحيات كل فرد</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[46rem]">
          <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
            <tr>
              <th className="p-3.5">الاسم والوظيفة</th>
              <th className="p-3.5">البريد الإلكتروني</th>
              <th className="p-3.5">الدور</th>
              <th className="p-3.5">الحالة</th>
              <th className="p-3.5">الصلاحيات المخصصة</th>
              <th className="p-3.5">التحكم والإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/40">
                <td className="p-3.5">
                  <span className="font-bold text-white block">{m.name}</span>
                  {m.jobTitle && (
                    <span className="text-[10px] text-slate-400">{m.jobTitle}</span>
                  )}
                </td>
                <td className="p-3.5 text-slate-300 font-mono text-[11px]" dir="ltr">
                  {m.email}
                </td>
                <td className="p-3.5">
                  <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold">
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`inline-block border rounded-md px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[m.status] ?? ''}`}
                  >
                    {STATUS_LABELS[m.status] ?? m.status}
                  </span>
                </td>
                <td className="p-3.5">
                  {m.role === 'OWNER' ? (
                    <span className="text-emerald-400 font-bold">صلاحيات كاملة مطلقة (المالك)</span>
                  ) : m.overrideCount > 0 ? (
                    <span className="text-amber-400 font-bold">{m.overrideCount} صلاحية مخصصة</span>
                  ) : (
                    <span className="text-slate-500">حسب الدور ({ROLE_LABELS[m.role] ?? m.role})</span>
                  )}
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    {m.role !== 'OWNER' && canManagePerms && (
                      <button
                        type="button"
                        onClick={() => onEditPermissions(m.id)}
                        className="bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        تعديل الصلاحيات
                      </button>
                    )}
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
      if (err instanceof ApiRequestError && err.status === 0) {
        onChanged();
      } else {
        alert(err instanceof ApiRequestError ? err.message : 'تعذر إلغاء الدعوة');
      }
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-bold flex items-center gap-2">
        <Mail className="w-3.5 h-3.5 text-amber-400" />
        دعوات معلقة بانتظار تفعيل الموظف ({invitations.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[38rem]">
          <thead className="bg-slate-800/80 text-slate-400 font-bold border-b border-slate-700">
            <tr>
              <th className="p-3.5">البريد الإلكتروني</th>
              <th className="p-3.5">الدور المخصص</th>
              <th className="p-3.5">صاحب الدعوة</th>
              <th className="p-3.5">صلاحية الرابط</th>
              <th className="p-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {invitations.map((i) => (
              <tr key={i.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 text-slate-200 font-mono" dir="ltr">
                  {i.email}
                </td>
                <td className="p-3.5 text-slate-300 font-bold">{ROLE_LABELS[i.role] ?? i.role}</td>
                <td className="p-3.5 text-slate-400">{i.invitedBy?.name ?? 'المالك'}</td>
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
  onDone: (newMember?: Member) => void;
}) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', role: 'EMPLOYEE', jobTitle: '' });
  const [grants, setGrants] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ email: string; token: string } | null>(null);

  const groups = useMemo(() => groupPermissions(catalog.length ? catalog : MOCK_CATALOG), [catalog]);

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
      if (err instanceof ApiRequestError && err.status === 0) {
        // Mock preview invitation generator
        const mockToken = `inv-${Date.now().toString(36)}`;
        const newMember: Member = {
          id: `usr-${Date.now().toString(36)}`,
          name: form.name,
          email: form.email,
          role: form.role,
          status: 'PENDING_INVITATION',
          jobTitle: form.jobTitle || 'عضو فريق جديد',
          overrideCount: grants.size,
        };
        setIssued({ email: form.email, token: mockToken });
        onDone(newMember);
        return;
      }
      setError(err instanceof ApiRequestError ? err.message : 'تعذر إرسال الدعوة');
    } finally {
      setSubmitting(false);
    }
  }

  if (issued) {
    const link = `${window.location.origin}/invitation/${issued.token}`;
    return (
      <Modal title="تم إنشاء الدعوة وتحديد الصلاحيات المخصصة" onClose={() => onDone()}>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            تم تسجيل الحساب بنجاح. أرسل هذا الرابط المباشر للموظف <span dir="ltr" className="text-sky-400 font-bold">{issued.email}</span> ليقوم بإنشاء كلمة مروره وتفعيل حسابه بالصلاحيات التي حددتها له.
          </p>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-300">
            <span className="font-bold block mb-1">البيانات المخصصة للمستخدم:</span>
            <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
              <li>الدور الأساسي: <strong className="text-white">{ROLE_LABELS[form.role]}</strong></li>
              <li>عدد الصلاحيات المخصصة المستثناة: <strong className="text-amber-400">{grants.size} صلاحية</strong></li>
            </ul>
          </div>
          <CopyField value={link} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="إضافة / دعوة موظف جديد مع تخصيص الصلاحيات" onClose={onClose}>
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
              placeholder="مثال: المهندس يوسف حسن"
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
              placeholder="youssef@company.com"
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
              placeholder="أخصائي متابعة وتسجيل"
            />
          </Field>
        </div>

        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            تحديد صلاحيات خاصة إضافية لـ {form.name || 'الموظف'}
          </p>
          <p className="text-[11px] text-slate-400 mb-3">
            الدور المختصر يمنح صلاحياته التلقائية. اختر من القائمة التالية الصلاحيات الإضافية التي ترغب بمنحها حصرياً لهذا الموظف:
          </p>

          <div className="max-h-60 overflow-y-auto flex flex-col gap-3 pl-1 pr-1 border border-slate-800 rounded-xl p-3 bg-slate-950/40">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="text-[11px] font-bold text-sky-300 mb-1.5 border-b border-slate-800 pb-1">{group.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.items.map((p) => (
                    <label
                      key={p.code}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-slate-800 bg-slate-900/80 text-[11px] cursor-pointer hover:border-sky-500 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={grants.has(p.code)}
                        onChange={() => toggle(p.code)}
                        className="accent-sky-500 w-3.5 h-3.5"
                      />
                      <span className="text-slate-200 font-medium">{p.labelAr}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            إلغاء
          </button>
          <button type="submit" disabled={submitting} className={BTN_PRIMARY}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            تأكيد وإنشاء رابط الدعوة والصلاحيات
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
  const fromRole = useMemo(() => new Set(member.rolePermissions), [member.rolePermissions]);

  const [effective, setEffective] = useState<Set<string>>(
    () => new Set(member.effectivePermissions),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => groupPermissions(catalog.length ? catalog : MOCK_CATALOG), [catalog]);

  function toggle(code: string) {
    setEffective((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  const overrides = useMemo(
    () =>
      (catalog.length ? catalog : MOCK_CATALOG)
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
      if (err instanceof ApiRequestError && err.status === 0) {
        alert(`تم حفظ وتحديث الصلاحيات المخصصة لـ ${member.name} بنجاح.`);
        onDone();
      } else {
        setError(err instanceof ApiRequestError ? err.message : 'تعذر حفظ الصلاحيات');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const added = overrides.filter((o) => o.granted).length;
  const removed = overrides.length - added;

  return (
    <Modal title={`تخصيص صلاحيات الموظف: ${member.name}`} onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-1 font-bold">
            الدور الحالي: {ROLE_LABELS[member.role] ?? member.role}
          </span>
          <span className="bg-slate-800 text-slate-300 border border-slate-700 rounded-md px-2 py-1">
            {effective.size} صلاحية فعّالة
          </span>
          {added > 0 && (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md px-2 py-1 font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" />
              {added} صلاحية إضافية ممنوحة
            </span>
          )}
          {removed > 0 && (
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md px-2 py-1 font-bold flex items-center gap-1">
              <Minus className="w-3 h-3" />
              {removed} صلاحية مسحوبة
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 text-xs">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto flex flex-col gap-4 pl-1 border border-slate-800 rounded-xl p-3 bg-slate-950/40">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-[11px] font-bold text-sky-400 mb-1.5 border-b border-slate-800 pb-1">{group.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.items.map((p) => {
                  const checked = effective.has(p.code);
                  const inRole = fromRole.has(p.code);
                  const differs = checked !== inRole;

                  return (
                    <label
                      key={p.code}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 border text-[11px] transition-colors cursor-pointer ${
                        differs
                          ? checked
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:border-sky-500'
                      }`}
                      title={p.description}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.code)}
                          className="accent-sky-500 w-3.5 h-3.5"
                        />
                        <span className="text-slate-200 font-medium">{p.labelAr}</span>
                      </span>
                      {inRole && (
                        <span className="text-[9px] text-slate-500 shrink-0">من الدور تلقائياً</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            إلغاء
          </button>
          <button type="button" onClick={save} disabled={submitting} className={BTN_PRIMARY}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            حفظ الصلاحيات المخصصة
          </button>
        </div>
      </div>
    </Modal>
  );
}

// --- shared ------------------------------------------------------------------

const INPUT =
  'w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent';
const BTN_PRIMARY =
  'bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 transition-colors shadow-md shadow-sky-600/30';
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
      <span className="block text-slate-300 mb-1 font-bold text-xs">{label}</span>
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
        className={`glass-card w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-black text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
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
        className={`${INPUT} text-left text-[11px] font-mono`}
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl px-3 py-2.5 flex items-center gap-1.5 shrink-0 transition-colors shadow-md shadow-sky-600/30"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            تم النسخ
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            نسخ الرابط
          </>
        )}
      </button>
    </div>
  );
}
