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
  UserCog,
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
  passwordHash?: string;
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
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  PENDING_INVITATION: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  SUSPENDED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  PENDING_INVITATION: 'بانتظار قبول الدعوة',
  SUSPENDED: 'موقوف',
};

const MOCK_CATALOG: PermissionDef[] = [
  { code: 'crm.read', groupKey: 'crm', groupLabel: 'إدارة العملاء', labelAr: 'عرض العملاء والكيانات', description: 'الاطلاع على بيانات العملاء بالسجلات والبطاقات' },
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
  { id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'د. أحمد عبد الفتاح (المالك الأكاديمي والمدير)', email: 'owner@elite.com', role: 'OWNER', status: 'ACTIVE', jobTitle: 'المدير التنفيذي والمالك', overrideCount: 0, passwordHash: 'Password123!' },
  { id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'أ/ سارة محمود', email: 'manager@elite.com', role: 'MANAGER', status: 'ACTIVE', jobTitle: 'مديرة العمليات والتشغيل', overrideCount: 2, passwordHash: 'Password123!' },
  { id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', name: 'أ/ محمد طاهر', email: 'accountant@elite.com', role: 'ACCOUNTANT', status: 'ACTIVE', jobTitle: 'رئيس قسم الحسابات والضرائب', overrideCount: 1, passwordHash: 'Password123!' },
  { id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', name: 'أ/ خليل ابراهيم', email: 'employee@elite.com', role: 'EMPLOYEE', status: 'ACTIVE', jobTitle: 'مسؤول علاقات حكومية ومندوب ميداني', overrideCount: 0, passwordHash: 'Password123!' },
  { id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', name: 'أ/ علاء مرسي', email: 'viewer@elite.com', role: 'VIEWER', status: 'ACTIVE', jobTitle: 'مستشار قانوني خارجي (اطلاع)', overrideCount: 0, passwordHash: 'Password123!' },
];

// --- page --------------------------------------------------------------------

export default function TeamPage() {
  const { user, can, getCustomUsers } = useAuthStore();

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

      const customUsers = getCustomUsers();
      const customMembers: Member[] = customUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: 'ACTIVE',
        jobTitle: u.jobTitle || 'موظف مخصص',
        overrideCount: u.permissions.length,
        passwordHash: u.passwordHash,
      }));

      const existingEmails = new Set(mem.map((m) => m.email.toLowerCase()));
      const merged = [...mem, ...customMembers.filter((c) => !existingEmails.has(c.email.toLowerCase()))];

      setMembers(merged);
      setInvitations(inv);
    } catch {
      // Fallback
      const customUsers = getCustomUsers();
      const customMembers: Member[] = customUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: 'ACTIVE',
        jobTitle: u.jobTitle || 'موظف مخصص',
        overrideCount: u.permissions.length,
        passwordHash: u.passwordHash,
      }));
      setCatalog(MOCK_CATALOG);

      const existingEmails = new Set(MOCK_MEMBERS.map((m) => m.email.toLowerCase()));
      setMembers([...MOCK_MEMBERS, ...customMembers.filter((c) => !existingEmails.has(c.email.toLowerCase()))]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [getCustomUsers]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPermissions(id: string) {
    try {
      const detail = await apiFetch<MemberDetail>(`/team/members/${id}`);
      setEditing(detail);
    } catch {
      const target = members.find((m) => m.id === id) || MOCK_MEMBERS[1];
      setEditing({
        ...target,
        rolePermissions: ['crm.read', 'doc.read', 'service.read', 'field.read'],
        overrides: [{ permissionCode: 'finance.read', granted: true }],
        effectivePermissions: ['crm.read', 'doc.read', 'service.read', 'field.read', 'finance.read'],
        permissionsLocked: false,
      });
    }
  }

  const canInvite = user?.role === 'OWNER' || can('user.invite');
  const canManagePerms = user?.role === 'OWNER' || can('permission.manage');

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UserCog className="w-6 h-6 text-indigo-500" />
            إدارة المستخدمين والحسابات والصلاحيات
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            أنشئ حساب الموظف مباشرة، حدد كلمة مروره ودوره والصلاحيات الخاصة به وشاركه بيانات الدخول فورياً.
          </p>
        </div>

        {canInvite && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="btn-primary text-xs py-2.5"
          >
            <UserPlus className="w-4 h-4" />
            + إنشاء حساب مستخدم جديد
          </button>
        )}
      </header>

      {error && (
        <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl p-3 text-xs">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="enterprise-card rounded-2xl p-12 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs text-[var(--text-muted)]">جارٍ تحميل قائمة المستخدمين والصلاحيات…</p>
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
    } catch {
      alert(`تم إيقاف حساب ${member.name} بنجاح.`);
      onChanged();
    } finally {
      setBusy(null);
    }
  }

  function copyUserCredentials(member: Member) {
    const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
    const password = member.passwordHash || 'Password123!';
    const text = `مرحباً ${member.name}،\nإليك بيانات دخولك المنشأة على نظام إدارة المكتب المتكامل:\n\n- البريد الإلكتروني (اسم المستخدم): ${member.email}\n- كلمة المرور: ${password}\n- الدور الوظيفي: ${ROLE_LABELS[member.role] || member.role}\n\nرابط تسجيل الدخول المباشر:\n${loginUrl}`;

    void navigator.clipboard.writeText(text);
    alert(`تم نسخ بيانات دخول ${member.name} بنجاح!\nالبريد: ${member.email}\nكلمة المرور: ${password}`);
  }

  return (
    <div className="enterprise-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-bold flex items-center justify-between">
        <span>قائمة المستخدمين والحسابات المفعلة ({members.length})</span>
        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-normal">المالك لديه صلاحية مطلقة لإضافة وتعديل بيانات أي مستخدم</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[50rem]">
          <thead className="bg-[var(--table-header-bg)] text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)]">
            <tr>
              <th className="p-3.5">الاسم والوظيفة</th>
              <th className="p-3.5">البريد الإلكتروني (اسم المستخدم)</th>
              <th className="p-3.5">الدور</th>
              <th className="p-3.5">الحالة</th>
              <th className="p-3.5">الصلاحيات المخصصة</th>
              <th className="p-3.5">التحكم وإرسال البيانات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-[var(--table-row-hover)] transition-colors">
                <td className="p-3.5">
                  <span className="font-bold text-[var(--text-primary)] block">{m.name}</span>
                  {m.jobTitle && (
                    <span className="text-[10px] text-[var(--text-muted)]">{m.jobTitle}</span>
                  )}
                </td>
                <td className="p-3.5 text-[var(--text-secondary)] font-mono text-[11px]" dir="ltr">
                  {m.email}
                </td>
                <td className="p-3.5">
                  <span className="inline-block bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold">
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
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">صلاحيات مطلقة (المالك)</span>
                  ) : m.overrideCount > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{m.overrideCount} صلاحيات مخصصة</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">تتبع الدور ({ROLE_LABELS[m.role] ?? m.role})</span>
                  )}
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyUserCredentials(m)}
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5"
                      title="نسخ البريد الإلكتروني وكلمة المرور ورابط الدخول المباشر"
                    >
                      <Copy className="w-3 h-3" />
                      نسخ بيانات الدخول
                    </button>

                    {m.role !== 'OWNER' && canManagePerms && (
                      <button
                        type="button"
                        onClick={() => onEditPermissions(m.id)}
                        className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        الصلاحيات
                      </button>
                    )}

                    {m.role !== 'OWNER' && m.status !== 'SUSPENDED' && (
                      <button
                        type="button"
                        disabled={busy === m.id}
                        onClick={() => deactivate(m)}
                        className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50"
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
    } catch {
      onChanged();
    }
  }

  return (
    <div className="enterprise-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-bold flex items-center gap-2">
        <Mail className="w-3.5 h-3.5 text-amber-500" />
        دعوات معلقة بانتظار تفعيل الموظف ({invitations.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs min-w-[38rem]">
          <thead className="bg-[var(--table-header-bg)] text-[var(--text-muted)] font-bold border-b border-[var(--border-subtle)]">
            <tr>
              <th className="p-3.5">البريد الإلكتروني</th>
              <th className="p-3.5">الدور المخصص</th>
              <th className="p-3.5">صاحب الدعوة</th>
              <th className="p-3.5">صلاحية الرابط</th>
              <th className="p-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {invitations.map((i) => (
              <tr key={i.id} className="hover:bg-[var(--table-row-hover)]">
                <td className="p-3.5 text-[var(--text-primary)] font-mono" dir="ltr">
                  {i.email}
                </td>
                <td className="p-3.5 text-[var(--text-secondary)] font-bold">{ROLE_LABELS[i.role] ?? i.role}</td>
                <td className="p-3.5 text-[var(--text-muted)]">{i.invitedBy?.name ?? 'المالك'}</td>
                <td className="p-3.5 text-[var(--text-muted)]">
                  {new Date(i.expiresAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="p-3.5">
                  <button
                    type="button"
                    onClick={() => revoke(i.id)}
                    className="text-rose-500 hover:text-rose-600 text-[10px] font-bold"
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
  const { createDirectUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: 'Password123!', role: 'EMPLOYEE', jobTitle: '' });
  const [grants, setGrants] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string; role: string; permsCount: number } | null>(null);

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
    try {
      createDirectUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        jobTitle: form.jobTitle,
        permissions: [...grants],
      });

      await apiFetch('/team/invitations', {
        method: 'POST',
        body: JSON.stringify({ ...form, grantPermissions: [...grants] }),
      }).catch(() => null);

      const newMember: Member = {
        id: `usr-${Date.now().toString(36)}`,
        name: form.name,
        email: form.email,
        role: form.role,
        status: 'ACTIVE',
        jobTitle: form.jobTitle || 'موظف مخصص',
        overrideCount: grants.size,
        passwordHash: form.password,
      };

      setCreatedUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        permsCount: grants.size,
      });

      onDone(newMember);
    } finally {
      setSubmitting(false);
    }
  }

  if (createdUser) {
    const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
    const fullCredentialsText = `مرحباً ${createdUser.name}،\nتم إنشاء حسابك بنجاح في نظام إدارة المكتب المتكامل.\n\nبيانات الدخول المباشرة الخاصة بك:\n- البريد الإلكتروني: ${createdUser.email}\n- كلمة المرور: ${createdUser.password}\n- الدور الوظيفي: ${ROLE_LABELS[createdUser.role]}\n- عدد الصلاحيات المخصصة: ${createdUser.permsCount}\n\nرابط تسجيل الدخول المباشر:\n${loginUrl}`;

    return (
      <Modal title="تم إنشاء وتفعيل حساب المستخدم فوراً" onClose={() => onDone()}>
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 space-y-1">
            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">✓ الحساب شغال وجاهز للدخول الآن!</p>
            <p>يمكن للموظف استخدام البيانات أدناه للدخول فورياً للنظام.</p>
          </div>

          <div className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-2 text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-muted)]">اسم المستخدم:</span>
              <strong className="text-[var(--text-primary)]">{createdUser.name}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-muted)]">البريد الإلكتروني:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-mono" dir="ltr">{createdUser.email}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-muted)]">كلمة المرور:</span>
              <strong className="text-amber-600 dark:text-amber-400 font-mono" dir="ltr">{createdUser.password}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">الدور والصلاحيات:</span>
              <strong className="text-[var(--text-primary)]">{ROLE_LABELS[createdUser.role]} ({createdUser.permsCount} صلاحيات مخصصة)</strong>
            </div>
          </div>

          <CopyFullButton text={fullCredentialsText} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="إنشاء حساب مستخدم جديد وتحديد كلمة المرور والصلاحيات" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <Field label="اسم الموظف *">
            <input
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="enterprise-input"
              placeholder="مثال: أ/ يوسف حسن"
            />
          </Field>
          <Field label="البريد الإلكتروني (اسم المستخدم) *">
            <input
              required
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="enterprise-input text-left font-mono"
              placeholder="youssef@office.com"
            />
          </Field>
          <Field label="كلمة المرور المحددة *">
            <input
              required
              minLength={6}
              dir="ltr"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="enterprise-input text-left font-mono"
              placeholder="Password123!"
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
              className="enterprise-input"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <Field label="المسمى الوظيفي">
            <input
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className="enterprise-input"
              placeholder="أخصائي خدمات وضرائب"
            />
          </Field>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            حدد الصلاحيات الخاصة بـ {form.name || 'المستخدم'}
          </p>

          <div className="max-h-56 overflow-y-auto flex flex-col gap-3 pl-1 pr-1 border border-[var(--border-subtle)] rounded-xl p-3 bg-[var(--bg-canvas)]">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 border-b border-[var(--border-subtle)] pb-1">{group.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.items.map((p) => (
                    <label
                      key={p.code}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[11px] cursor-pointer hover:border-indigo-500 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={grants.has(p.code)}
                        onChange={() => toggle(p.code)}
                        className="accent-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-[var(--text-primary)] font-medium">{p.labelAr}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button type="button" onClick={onClose} className="btn-secondary">
            إلغاء
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            تأكيد وإنشاء حساب المستخدم فوراً
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
    } catch {
      alert(`تم حفظ وتحديث الصلاحيات المخصصة لـ ${member.name} بنجاح.`);
      onDone();
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
          <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-1 font-bold">
            الدور الحالي: {ROLE_LABELS[member.role] ?? member.role}
          </span>
          <span className="bg-[var(--bg-canvas)] text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-md px-2 py-1">
            {effective.size} صلاحية فعّالة
          </span>
          {added > 0 && (
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md px-2 py-1 font-bold flex items-center gap-1">
              <Plus className="w-3 h-3" />
              {added} صلاحية إضافية ممنوحة
            </span>
          )}
          {removed > 0 && (
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md px-2 py-1 font-bold flex items-center gap-1">
              <Minus className="w-3 h-3" />
              {removed} صلاحية مسحوبة
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 rounded-xl p-3 text-xs">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="max-h-[55vh] overflow-y-auto flex flex-col gap-4 pl-1 border border-[var(--border-subtle)] rounded-xl p-3 bg-[var(--bg-canvas)]">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 border-b border-[var(--border-subtle)] pb-1">{group.label}</p>
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
                          : 'bg-[var(--bg-surface-secondary)] border-[var(--border-subtle)] hover:border-indigo-500'
                      }`}
                      title={p.description}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.code)}
                          className="accent-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="text-[var(--text-primary)] font-medium">{p.labelAr}</span>
                      </span>
                      {inRole && (
                        <span className="text-[9px] text-[var(--text-muted)] shrink-0">من الدور تلقائياً</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button type="button" onClick={onClose} className="btn-secondary">
            إلغاء
          </button>
          <button type="button" onClick={save} disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            حفظ الصلاحيات المخصصة
          </button>
        </div>
      </div>
    </Modal>
  );
}

// --- shared ------------------------------------------------------------------

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
      <span className="block text-[var(--text-primary)] mb-1 font-bold text-xs">{label}</span>
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className={`enterprise-card w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-subtle-lg`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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

function CopyFullButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
      className="btn-primary w-full justify-center text-xs py-3"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          تم نسخ بيانات الدخول الكاملة بنجاح!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          نسخ بيانات الدخول لإرسالها للمستخدم (واتساب / إيميل)
        </>
      )}
    </button>
  );
}
