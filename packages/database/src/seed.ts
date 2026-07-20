/**
 * Development seed.
 *
 * Creates TWO tenants on purpose. A single-tenant seed cannot demonstrate — or
 * test — isolation, and isolation is the property this system must never get
 * wrong. The isolation tests assert that tenant A cannot observe tenant B.
 *
 * Refuses to run against production. Passwords are real bcrypt hashes, never
 * placeholder strings, and the credentials below exist only in development.
 */
import { LegalType, PrismaClient, SequenceKind, TenantStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_CATALOG } from './permissions';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;
const DEV_PASSWORD = 'DevPass!2026';

async function seedPermissionCatalog(): Promise<void> {
  await prisma.$transaction(
    PERMISSION_CATALOG.map((p, index) =>
      prisma.permission.upsert({
        where: { code: p.code },
        create: { ...p, sortOrder: index },
        update: { ...p, sortOrder: index },
      }),
    ),
  );
  console.log(`  ✓ ${PERMISSION_CATALOG.length} permissions`);
}

interface TenantSpec {
  name: string;
  slug: string;
  prefix: string;
  clients: Array<{
    name: string;
    company: string;
    trade: string;
    legal: LegalType;
    phone: string;
    activity: string;
  }>;
}

async function seedTenant(spec: TenantSpec, passwordHash: string): Promise<void> {
  const tenant = await prisma.tenant.create({
    data: {
      name: spec.name,
      slug: spec.slug,
      status: TenantStatus.ACTIVE,
      email: `owner@${spec.slug}.test`,
      settings: { currency: 'EGP', timezone: 'Africa/Cairo', locale: 'ar-EG' },
    },
  });

  await prisma.rolePermission.createMany({
    data: (Object.entries(DEFAULT_ROLE_PERMISSIONS) as [UserRole, string[]][]).flatMap(
      ([role, codes]) =>
        codes.map((permissionCode) => ({ tenantId: tenant.id, role, permissionCode, granted: true })),
    ),
    skipDuplicates: true,
  });

  await prisma.numberSequence.createMany({
    data: [
      { tenantId: tenant.id, kind: SequenceKind.CLIENT_CODE, prefix: `${spec.prefix}-CL-`, current: spec.clients.length },
      { tenantId: tenant.id, kind: SequenceKind.INVOICE_NUMBER, prefix: `${spec.prefix}-INV-` },
      { tenantId: tenant.id, kind: SequenceKind.SERVICE_ORDER, prefix: `${spec.prefix}-SO-` },
      { tenantId: tenant.id, kind: SequenceKind.CONTRACT_NUMBER, prefix: `${spec.prefix}-CT-` },
      { tenantId: tenant.id, kind: SequenceKind.EXPENSE_VOUCHER, prefix: `${spec.prefix}-EXP-` },
    ],
  });

  const staff: Array<[UserRole, string, string]> = [
    [UserRole.OWNER, 'صاحب المكتب', 'المدير العام'],
    [UserRole.MANAGER, 'مدير التشغيل', 'مدير تشغيل'],
    [UserRole.ACCOUNTANT, 'المحاسب', 'محاسب أول'],
    [UserRole.EMPLOYEE, 'موظف التنفيذ', 'أخصائي خدمات'],
    [UserRole.VIEWER, 'المراجع', 'مراجع داخلي'],
  ];

  const users = [];
  for (const [role, name, jobTitle] of staff) {
    users.push(
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: `${name} — ${spec.name}`,
          email: `${role.toLowerCase()}@${spec.slug}.test`,
          passwordHash,
          role,
          status: UserStatus.ACTIVE,
          jobTitle,
          hireDate: new Date('2024-01-15'),
          salary: role === UserRole.OWNER ? 40_000 : 12_000,
        },
      }),
    );
  }

  const accountManager = users.find((u) => u.role === UserRole.EMPLOYEE)!;

  for (const [i, c] of spec.clients.entries()) {
    await prisma.client.create({
      data: {
        tenantId: tenant.id,
        clientCode: `${spec.prefix}-CL-${String(i + 1).padStart(4, '0')}`,
        name: c.name,
        companyName: c.company,
        tradeName: c.trade,
        legalType: c.legal,
        phone: c.phone,
        whatsapp: c.phone,
        businessActivity: c.activity,
        governorate: 'القاهرة',
        accountManagerId: accountManager.id,
      },
    });
  }

  console.log(`  ✓ ${spec.name} (${spec.slug}) — ${users.length} users, ${spec.clients.length} clients`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database.');
  }

  console.log('Seeding…');

  // Tenant cascades remove every scoped row; permissions are global.
  await prisma.tenant.deleteMany();
  await prisma.permission.deleteMany();

  await seedPermissionCatalog();

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, BCRYPT_ROUNDS);

  await seedTenant(
    {
      name: 'مكتب النخبة للاستشارات',
      slug: 'elite',
      prefix: 'EL',
      clients: [
        { name: 'محمود عبد الرحمن', company: 'شركة الأمل للتجارة', trade: 'الأمل', legal: LegalType.LLC, phone: '01012345678', activity: 'تجارة مواد غذائية' },
        { name: 'سارة إبراهيم', company: 'مؤسسة النور للمقاولات', trade: 'النور', legal: LegalType.SOLE_PROPRIETORSHIP, phone: '01123456789', activity: 'مقاولات عامة' },
        { name: 'كريم فؤاد', company: 'شركة الشروق للاستيراد', trade: 'الشروق', legal: LegalType.JOINT_STOCK, phone: '01234567890', activity: 'استيراد وتصدير' },
      ],
    },
    passwordHash,
  );

  await seedTenant(
    {
      name: 'مكتب البيان للمحاسبة',
      slug: 'bayan',
      prefix: 'BY',
      clients: [
        { name: 'هدى مصطفى', company: 'شركة الوفاء للخدمات', trade: 'الوفاء', legal: LegalType.ONE_PERSON_COMPANY, phone: '01098765432', activity: 'خدمات إدارية' },
        { name: 'طارق سعيد', company: 'شركة المستقبل للبرمجيات', trade: 'المستقبل', legal: LegalType.LLC, phone: '01187654321', activity: 'تطوير برمجيات' },
      ],
    },
    passwordHash,
  );

  console.log(`\nDone. Development password for every seeded account: ${DEV_PASSWORD}`);
  console.log('  elite → owner@elite.test · manager@elite.test · accountant@elite.test · employee@elite.test · viewer@elite.test');
  console.log('  bayan → owner@bayan.test · …');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
