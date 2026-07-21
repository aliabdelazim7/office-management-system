'use client';

import React, { useState } from 'react';
import {
  Users,
  Building2,
  FileWarning,
  Wallet,
  ArrowUpRight,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  UserPlus,
  ShieldCheck,
  Loader2,
  Check,
  Copy,
  X,
  Key,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { apiFetch } from '@/lib/api';

interface PermissionDef {
  code: string;
  groupKey: string;
  groupLabel: string;
  labelAr: string;
  description?: string;
}

const PERMISSIONS_LIST: PermissionDef[] = [
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
  { code: 'user.invite', groupKey: 'team', groupLabel: 'إدارة الفريق', labelAr: 'دعوة موظف جديد', description: 'إنشاء حساب موظف جديد' },
  { code: 'permission.manage', groupKey: 'system', groupLabel: 'إعدادات النظام', labelAr: 'تعديل مصفوفة الصلاحيات', description: 'منح وسحب الصلاحيات المخصصة' },
];

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

export default function ExecutiveDashboard() {
  const { user } = useAuthStore();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const kpiCards = [
    { title: 'إجمالي العملاء والشركات', value: '48 عميل', change: '+12% هذا الشهر', icon: Users, accent: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { title: 'الإيرادات الشهرية المحصلة', value: '145,000 ج.م', change: '+18.5% نمو', icon: Wallet, accent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'مستندات تقترب من الانتهاء', value: '3 مستندات', change: 'يلزم التجديد خلال 30 يوم', icon: FileWarning, accent: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { title: 'الخدمات المفتوحة والميدانية', value: '14 معاملة', change: '8 معاملات جارية الآن', icon: Clock, accent: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  ];

  const expiringAlerts = [
    { type: 'سجل تجاري', company: 'شركة المصرية للحلول البرمجية', number: 'CR-994821', days: 15, urgency: 'HIGH' },
    { type: 'بطاقة ضريبية', company: 'شركة المصرية للحلول البرمجية', number: 'TAX-554-321', days: 15, urgency: 'HIGH' },
    { type: 'سجل تجاري', company: 'مؤسسة السعيد للمقاولات', number: 'CR-104928', days: 90, urgency: 'LOW' },
  ];

  const recentServices = [
    { order: 'SRV-2026-001', client: 'شركة المصرية للحلول البرمجية', service: 'تجديد السجل التجاري والبطاقة الضريبية', staff: 'أ/ خليل ابراهيم (مندوب)', status: 'IN_PROGRESS', amount: '7,500 ج.م' },
    { order: 'SRV-2026-002', client: 'مؤسسة السعيد للمقاولات', service: 'تأسيس شركة ذات مسؤولية محدودة', staff: 'أ/ سارة محمود (مديرة)', status: 'PENDING', amount: '15,000 ج.م' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#14181f] border border-[#222733] shadow-subtle-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            مرحباً بك، {user?.name || 'د. أحمد عبد الفتاح'} 👋
          </h1>
          <p className="text-xs text-slate-400">
            لوحة تحكم المنظومة — نظرة شاملة وفورية على المأموريات والمستندات والعمليات الميدانية والمالية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-subtle-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            + إنشاء حساب موظف وتحديد الصلاحيات
          </button>

          <Link
            href="/dashboard/documents"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1a202c] hover:bg-[#2d3748] text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-[#222733] transition-colors"
          >
            <FileCheck className="w-4 h-4 text-indigo-400" />
            استعراض المستندات والتجديدات
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="enterprise-card p-5 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`w-9 h-9 rounded-xl ${card.accent} border flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-100">{card.value}</h3>
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Expiry Alerts & Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Automatic Expiry Renewal Alerts Engine */}
        <div className="enterprise-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222733] pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              تنبيهات التجديد الآلية (Expiry Engine)
            </h3>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              3 تنبيهات
            </span>
          </div>

          <div className="space-y-3">
            {expiringAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                  alert.urgency === 'HIGH'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : 'bg-[#1a202c] border-[#222733] text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{alert.type}: {alert.number}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px]">
                    متبقي {alert.days} يوم
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300">{alert.company}</p>
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-400">تنبيه آلي مجهز للواتساب</span>
                  <Link
                    href="/dashboard/documents"
                    className="text-indigo-400 hover:underline font-bold flex items-center gap-1"
                  >
                    بدء التجديد <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Services Workflow & Operations */}
        <div className="lg:col-span-2 enterprise-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222733] pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-xs sm:text-sm">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              أحدث معاملات ومهمات المكتب الجارية
            </h3>
            <Link href="/dashboard/services" className="text-xs text-indigo-400 font-bold hover:underline">
              عرض كافة الخدمات
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1a202c] text-slate-400 font-bold border-b border-[#222733]">
                <tr>
                  <th className="p-3">رقم الخدمة</th>
                  <th className="p-3">اسم العميل والشركة</th>
                  <th className="p-3">الخدمة المطلوبة</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222733] text-slate-200 font-medium">
                {recentServices.map((srv, idx) => (
                  <tr key={idx} className="hover:bg-[#1a202c]/60 transition-colors">
                    <td className="p-3 font-bold text-indigo-400">{srv.order}</td>
                    <td className="p-3 font-bold text-white">{srv.client}</td>
                    <td className="p-3 text-slate-300">{srv.service}</td>
                    <td className="p-3 text-slate-400">{srv.staff}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {srv.status === 'IN_PROGRESS' ? 'قيد التنفيذ الميداني' : 'معلقة'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">{srv.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addModalOpen && <DashboardAddUserModal onClose={() => setAddModalOpen(false)} />}
    </div>
  );
}

function DashboardAddUserModal({ onClose }: { onClose: () => void }) {
  const { createDirectUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: 'Password123!', role: 'EMPLOYEE', jobTitle: '' });
  const [grants, setGrants] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string; role: string; permsCount: number } | null>(null);

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

      setCreatedUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        permsCount: grants.size,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (createdUser) {
    const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
    const fullCredentialsText = `مرحباً ${createdUser.name}،\nتم إنشاء حسابك بنجاح في نظام إدارة المكتب المتكامل.\n\nبيانات الدخول المباشرة الخاصة بك:\n- البريد الإلكتروني: ${createdUser.email}\n- كلمة المرور: ${createdUser.password}\n- الدور الوظيفي: ${ROLE_LABELS[createdUser.role]}\n- عدد الصلاحيات المخصصة: ${createdUser.permsCount}\n\nرابط تسجيل الدخول المباشر:\n${loginUrl}`;

    return (
      <Modal title="تم تفعيل حساب الموظف فوراً" onClose={onClose}>
        <div className="flex flex-col gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
            <p className="font-bold text-sm text-emerald-400">✓ الحساب فعال وجاهز للدخول الآن!</p>
            <p>يمكن للموظف الدخول فوراً ببيانات الاعتماد التلاحمية التي قمت بتحديدها.</p>
          </div>

          <div className="bg-[#101418] border border-[#222733] rounded-xl p-3.5 space-y-2 text-slate-200">
            <div className="flex justify-between items-center border-b border-[#222733] pb-1.5">
              <span className="text-slate-400">اسم الموظف:</span>
              <strong className="text-white">{createdUser.name}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-[#222733] pb-1.5">
              <span className="text-slate-400">البريد الإلكتروني:</span>
              <strong className="text-indigo-400 font-mono" dir="ltr">{createdUser.email}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-[#222733] pb-1.5">
              <span className="text-slate-400">كلمة المرور:</span>
              <strong className="text-amber-400 font-mono" dir="ltr">{createdUser.password}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">الدور والصلاحيات:</span>
              <strong className="text-white">{ROLE_LABELS[createdUser.role]} ({createdUser.permsCount} صلاحيات مخصصة)</strong>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">نص بيانات الدخول (جاهز للنسخ والإرسال على واتساب أو إيميل):</label>
            <textarea
              readOnly
              dir="rtl"
              rows={6}
              value={fullCredentialsText}
              className="w-full bg-[#101418] border border-[#222733] rounded-xl p-3 text-slate-200 text-xs font-mono focus:outline-none"
            />
          </div>

          <CopyFullButton text={fullCredentialsText} />
        </div>
      </Modal>
    );
  }

  const groups = groupPermissions(PERMISSIONS_LIST);

  return (
    <Modal title="إنشاء وتفعيل حساب موظف بكلمة مرور وصلاحيات مخصصة" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-bold">اسم الموظف *</label>
            <input
              required
              minLength={3}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="enterprise-input"
              placeholder="مثال: أ/ يوسف حسن"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1 font-bold">البريد الإلكتروني (اسم المستخدم) *</label>
            <input
              required
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="enterprise-input text-left font-mono"
              placeholder="youssef@office.com"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1 font-bold flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              كلمة المرور المحددة *
            </label>
            <input
              required
              minLength={6}
              dir="ltr"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="enterprise-input text-left font-mono"
              placeholder="Password123!"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1 font-bold">الدور الوظيفي *</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="enterprise-input"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-1 font-bold text-xs">المسمى الوظيفي</label>
          <input
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            className="enterprise-input"
            placeholder="أخصائي شؤون وضرائب"
          />
        </div>

        <div className="border-t border-[#222733] pt-3">
          <p className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            حدد الصلاحيات الخاصة التي يدخل بها {form.name || 'الموظف'}
          </p>

          <div className="max-h-56 overflow-y-auto flex flex-col gap-3 pl-1 pr-1 border border-[#222733] rounded-xl p-3 bg-[#101418]">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="text-[11px] font-bold text-indigo-300 mb-1.5 border-b border-[#222733] pb-1">{group.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.items.map((p) => (
                    <label
                      key={p.code}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 border border-[#222733] bg-[#14181f] text-[11px] cursor-pointer hover:border-indigo-500 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={grants.has(p.code)}
                        onChange={() => toggle(p.code)}
                        className="accent-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-slate-200 font-medium">{p.labelAr}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#222733]">
          <button type="button" onClick={onClose} className="btn-secondary">
            إلغاء
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            تأكيد وإنشاء حساب الموظف فوراً
          </button>
        </div>
      </form>
    </Modal>
  );
}

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

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-[#0b0f14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="enterprise-card w-full max-w-2xl rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-subtle-lg"
      >
        <div className="flex items-center justify-between border-b border-[#222733] pb-3">
          <h2 className="text-sm font-bold text-white">{title}</h2>
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
