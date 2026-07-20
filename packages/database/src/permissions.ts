import { UserRole } from '@prisma/client';

/**
 * The permission catalogue is the single source of truth for authorisation.
 *
 * It lives on the server and is served to the client, so the admin UI renders
 * the permission matrix from this file rather than a duplicated frontend list
 * that silently drifts out of sync.
 *
 * Codes are `resource.action`. Never reuse a code for a different meaning —
 * tenants may have customised their matrix against the old meaning.
 */

export interface PermissionDefinition {
  code: string;
  groupKey: string;
  groupLabel: string;
  labelAr: string;
  labelEn: string;
  description?: string;
}

interface GroupSpec {
  key: string;
  labelAr: string;
  permissions: Array<{
    code: string;
    ar: string;
    en: string;
    desc?: string;
  }>;
}

const GROUPS: GroupSpec[] = [
  {
    key: 'crm',
    labelAr: 'إدارة العملاء',
    permissions: [
      { code: 'client.view', ar: 'عرض العملاء', en: 'View clients' },
      { code: 'client.view_all', ar: 'عرض كل العملاء', en: 'View all clients', desc: 'بدون هذه الصلاحية يرى الموظف عملاءه المكلف بهم فقط' },
      { code: 'client.create', ar: 'إضافة عميل', en: 'Create client' },
      { code: 'client.update', ar: 'تعديل عميل', en: 'Update client' },
      { code: 'client.delete', ar: 'حذف عميل', en: 'Delete client' },
      { code: 'client.export', ar: 'تصدير بيانات العملاء', en: 'Export clients' },
    ],
  },
  {
    key: 'documents',
    labelAr: 'المستندات',
    permissions: [
      { code: 'document.view', ar: 'عرض المستندات', en: 'View documents' },
      { code: 'document.upload', ar: 'رفع مستند', en: 'Upload document' },
      { code: 'document.update', ar: 'تعديل مستند', en: 'Update document' },
      { code: 'document.delete', ar: 'حذف مستند', en: 'Delete document' },
      { code: 'document.download', ar: 'تحميل مستند', en: 'Download document' },
    ],
  },
  {
    key: 'government',
    labelAr: 'المستندات الحكومية',
    permissions: [
      { code: 'gov.view', ar: 'عرض المستندات الحكومية', en: 'View government records' },
      { code: 'gov.manage', ar: 'إدارة المستندات الحكومية', en: 'Manage government records' },
    ],
  },
  {
    key: 'contracts',
    labelAr: 'العقود',
    permissions: [
      { code: 'contract.view', ar: 'عرض العقود', en: 'View contracts' },
      { code: 'contract.manage', ar: 'إدارة العقود', en: 'Manage contracts' },
      { code: 'contract.template.manage', ar: 'إدارة قوالب العقود', en: 'Manage contract templates' },
    ],
  },
  {
    key: 'services',
    labelAr: 'الخدمات وسير العمل',
    permissions: [
      { code: 'service.view', ar: 'عرض أوامر الخدمة', en: 'View service orders' },
      { code: 'service.view_all', ar: 'عرض كل أوامر الخدمة', en: 'View all service orders', desc: 'بدون هذه الصلاحية يرى الموظف المهام المكلف بها فقط' },
      { code: 'service.create', ar: 'إنشاء أمر خدمة', en: 'Create service order' },
      { code: 'service.update', ar: 'تعديل أمر خدمة', en: 'Update service order' },
      { code: 'service.delete', ar: 'حذف أمر خدمة', en: 'Delete service order' },
      { code: 'service.step.update', ar: 'تحديث مراحل العمل', en: 'Update workflow steps' },
      { code: 'service.catalog.manage', ar: 'إدارة كتالوج الخدمات', en: 'Manage service catalogue' },
    ],
  },
  {
    key: 'hr',
    labelAr: 'الموارد البشرية',
    permissions: [
      { code: 'user.view', ar: 'عرض الموظفين', en: 'View employees' },
      { code: 'user.invite', ar: 'دعوة موظف', en: 'Invite employee' },
      { code: 'user.update', ar: 'تعديل بيانات موظف', en: 'Update employee' },
      { code: 'user.deactivate', ar: 'إيقاف موظف', en: 'Deactivate employee' },
      { code: 'user.salary.view', ar: 'عرض المرتبات', en: 'View salaries' },
    ],
  },
  {
    key: 'field',
    labelAr: 'المهام الميدانية',
    permissions: [
      { code: 'field.view_own', ar: 'عرض مهامي الميدانية', en: 'View own field tasks' },
      { code: 'field.view_all', ar: 'عرض كل المهام الميدانية', en: 'View all field tasks' },
      { code: 'field.assign', ar: 'إسناد مهمة ميدانية', en: 'Assign field task' },
      { code: 'field.execute', ar: 'تنفيذ مهمة ميدانية', en: 'Execute field task' },
    ],
  },
  {
    key: 'finance',
    labelAr: 'الحسابات والمالية',
    permissions: [
      { code: 'invoice.view', ar: 'عرض الفواتير', en: 'View invoices' },
      { code: 'invoice.create', ar: 'إنشاء فاتورة', en: 'Create invoice' },
      { code: 'invoice.update', ar: 'تعديل فاتورة', en: 'Update invoice' },
      { code: 'invoice.delete', ar: 'حذف فاتورة', en: 'Delete invoice' },
      { code: 'payment.record', ar: 'تسجيل دفعة', en: 'Record payment' },
      { code: 'expense.view', ar: 'عرض المصروفات', en: 'View expenses' },
      { code: 'expense.manage', ar: 'إدارة المصروفات', en: 'Manage expenses' },
      { code: 'ledger.view', ar: 'عرض دفتر الأستاذ', en: 'View client ledger' },
      { code: 'finance.report', ar: 'التقارير المالية', en: 'Financial reports' },
    ],
  },
  {
    key: 'notifications',
    labelAr: 'التنبيهات والمراسلات',
    permissions: [
      { code: 'notification.view', ar: 'عرض التنبيهات', en: 'View notifications' },
      { code: 'notification.template.manage', ar: 'إدارة قوالب التنبيهات', en: 'Manage notification templates' },
      { code: 'whatsapp.send', ar: 'إرسال واتساب', en: 'Send WhatsApp' },
    ],
  },
  {
    key: 'reports',
    labelAr: 'التقارير ولوحة القيادة',
    permissions: [
      { code: 'dashboard.view', ar: 'عرض لوحة القيادة', en: 'View dashboard' },
      { code: 'dashboard.financial', ar: 'عرض المؤشرات المالية', en: 'View financial KPIs' },
      { code: 'report.staff_performance', ar: 'تقرير أداء الموظفين', en: 'Staff performance report' },
    ],
  },
  {
    key: 'ai',
    labelAr: 'المساعد الذكي',
    permissions: [{ code: 'ai.query', ar: 'استخدام المساعد الذكي', en: 'Use AI assistant' }],
  },
  {
    key: 'system',
    labelAr: 'النظام',
    permissions: [
      { code: 'audit.view', ar: 'عرض سجل التدقيق', en: 'View audit log' },
      { code: 'settings.manage', ar: 'إدارة إعدادات المكتب', en: 'Manage office settings' },
      { code: 'permission.manage', ar: 'إدارة مصفوفة الصلاحيات', en: 'Manage permission matrix' },
    ],
  },
];

/** Flat catalogue, ready to upsert into the `permissions` table. */
export const PERMISSION_CATALOG: PermissionDefinition[] = GROUPS.flatMap((group) =>
  group.permissions.map((p) => ({
    code: p.code,
    groupKey: group.key,
    groupLabel: group.labelAr,
    labelAr: p.ar,
    labelEn: p.en,
    description: p.desc,
  })),
);

export const ALL_PERMISSION_CODES: string[] = PERMISSION_CATALOG.map((p) => p.code);

/** Compile-time-ish guard against typos in `@RequirePermissions(...)`. */
export type PermissionCode = (typeof ALL_PERMISSION_CODES)[number];

// ---------------------------------------------------------------------------
//  Default matrix — the starting point provisioned for every new tenant.
//  Tenants may customise it afterwards via `role_permissions`.
// ---------------------------------------------------------------------------

const MANAGER: string[] = [
  'client.view', 'client.view_all', 'client.create', 'client.update', 'client.delete', 'client.export',
  'document.view', 'document.upload', 'document.update', 'document.delete', 'document.download',
  'gov.view', 'gov.manage',
  'contract.view', 'contract.manage', 'contract.template.manage',
  'service.view', 'service.view_all', 'service.create', 'service.update', 'service.delete',
  'service.step.update', 'service.catalog.manage',
  'user.view', 'user.invite', 'user.update', 'user.deactivate',
  'field.view_own', 'field.view_all', 'field.assign',
  'invoice.view', 'invoice.create', 'expense.view', 'ledger.view',
  'notification.view', 'notification.template.manage', 'whatsapp.send',
  'dashboard.view', 'report.staff_performance',
  'ai.query',
  'audit.view',
];

const ACCOUNTANT: string[] = [
  'client.view', 'client.view_all',
  'document.view', 'document.download',
  'gov.view',
  'contract.view',
  'service.view', 'service.view_all',
  'user.view', 'user.salary.view',
  'invoice.view', 'invoice.create', 'invoice.update', 'invoice.delete',
  'payment.record',
  'expense.view', 'expense.manage',
  'ledger.view', 'finance.report',
  'notification.view', 'whatsapp.send',
  'dashboard.view', 'dashboard.financial',
  'ai.query',
];

const EMPLOYEE: string[] = [
  // Deliberately WITHOUT `client.view_all` / `service.view_all` — an employee
  // sees only the clients and orders they are assigned to.
  'client.view', 'client.update',
  'document.view', 'document.upload', 'document.download',
  'gov.view',
  'contract.view',
  'service.view', 'service.update', 'service.step.update',
  'field.view_own', 'field.execute',
  'notification.view',
  'dashboard.view',
  'ai.query',
];

const VIEWER: string[] = [
  'client.view',
  'document.view',
  'gov.view',
  'contract.view',
  'service.view',
  'notification.view',
  'dashboard.view',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.OWNER]: ALL_PERMISSION_CODES,
  [UserRole.MANAGER]: MANAGER,
  [UserRole.ACCOUNTANT]: ACCOUNTANT,
  [UserRole.EMPLOYEE]: EMPLOYEE,
  [UserRole.VIEWER]: VIEWER,
};

/** Fails fast at boot if the default matrix references a code that does not exist. */
export function assertCatalogIntegrity(): void {
  const known = new Set(ALL_PERMISSION_CODES);
  const duplicates = ALL_PERMISSION_CODES.filter((c, i) => ALL_PERMISSION_CODES.indexOf(c) !== i);
  if (duplicates.length) {
    throw new Error(`Duplicate permission codes in catalogue: ${duplicates.join(', ')}`);
  }
  for (const [role, codes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length) {
      throw new Error(`Role ${role} references unknown permissions: ${unknown.join(', ')}`);
    }
  }
}
