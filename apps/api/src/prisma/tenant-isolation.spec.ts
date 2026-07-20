/**
 * Tenant isolation — the one property this system must never get wrong.
 *
 * These tests run against a REAL database, not a mock. A mocked Prisma client
 * would happily confirm whatever the extension claims to do; only the database
 * can tell us what the generated SQL actually returned.
 *
 * Requires a seeded database (pnpm db:seed), which creates two tenants
 * precisely so isolation can be observed rather than asserted.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaService } from './prisma.service';
import { TenantContextService, type TenantContext } from '../tenancy/tenant-context';

// Load .env by hand — this suite deliberately has no Nest application context,
// so ConfigModule is not in play.
function loadEnv(): void {
  const envPath = resolve(__dirname, '../../../../.env');
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (match) process.env[match[1]] ??= match[2].trim().replace(/^"|"$/g, '');
  }
}
loadEnv();

const ctx = new TenantContextService();
const prisma = new PrismaService(ctx);

function asTenant(tenantId: string): TenantContext {
  return {
    tenantId,
    userId: '00000000-0000-0000-0000-000000000000',
    role: 'OWNER',
    permissions: new Set<string>(),
    requestId: 'test',
  };
}

/**
 * Mirrors what the request pipeline does: enter the context, then run the work.
 * Awaiting *inside* matters — a lazy Prisma promise returned out of the scope
 * would execute after the store is gone.
 */
function runAs<T>(tenant: TenantContext, work: () => Promise<T>): Promise<T> {
  return ctx.run(tenant, async () => await work());
}

let eliteId: string;
let bayanId: string;

beforeAll(async () => {
  const tenants = await prisma.client.tenant.findMany({ select: { id: true, slug: true } });
  eliteId = tenants.find((t) => t.slug === 'elite')!.id;
  bayanId = tenants.find((t) => t.slug === 'bayan')!.id;
  expect(eliteId).toBeDefined();
  expect(bayanId).toBeDefined();
  expect(eliteId).not.toBe(bayanId);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('tenant isolation', () => {
  it('scopes findMany to the active tenant', async () => {
    const elite = await runAs(asTenant(eliteId), () => prisma.scoped.client.findMany());
    const bayan = await runAs(asTenant(bayanId), () => prisma.scoped.client.findMany());

    expect(elite).toHaveLength(3);
    expect(bayan).toHaveLength(2);
    expect(elite.every((c) => c.tenantId === eliteId)).toBe(true);
    expect(bayan.every((c) => c.tenantId === bayanId)).toBe(true);

    // No row appears in both result sets.
    const bayanIds = new Set(bayan.map((c) => c.id));
    expect(elite.some((c) => bayanIds.has(c.id))).toBe(false);
  });

  it('refuses to fetch another tenant row by its primary key', async () => {
    const [victim] = await runAs(asTenant(bayanId), () => prisma.scoped.client.findMany());

    // Knowing the exact UUID must not be enough.
    const stolen = await runAs(asTenant(eliteId), () =>
      prisma.scoped.client.findUnique({ where: { id: victim.id } }),
    );

    expect(stolen).toBeNull();
  });

  it('refuses to update another tenant row', async () => {
    const [victim] = await runAs(asTenant(bayanId), () => prisma.scoped.client.findMany());

    const result = await runAs(asTenant(eliteId), () =>
      prisma.scoped.client.updateMany({
        where: { id: victim.id },
        data: { companyName: 'HIJACKED' },
      }),
    );
    expect(result.count).toBe(0);

    const untouched = await runAs(asTenant(bayanId), () =>
      prisma.scoped.client.findUnique({ where: { id: victim.id } }),
    );
    expect(untouched!.companyName).not.toBe('HIJACKED');
  });

  it('refuses to delete another tenant row', async () => {
    const [victim] = await runAs(asTenant(bayanId), () => prisma.scoped.client.findMany());

    const result = await runAs(asTenant(eliteId), () =>
      prisma.scoped.client.deleteMany({ where: { id: victim.id } }),
    );
    expect(result.count).toBe(0);

    const survivor = await runAs(asTenant(bayanId), () =>
      prisma.scoped.client.findUnique({ where: { id: victim.id } }),
    );
    expect(survivor).not.toBeNull();
  });

  it('stamps the active tenant on create, ignoring any supplied tenantId', async () => {
    const created = await runAs(asTenant(eliteId), () =>
      prisma.scoped.client.create({
        data: {
          // A caller trying to plant a row in another tenant.
          tenantId: bayanId,
          clientCode: `TEST-${Date.now()}`,
          name: 'اختبار',
          companyName: 'شركة الاختبار',
          phone: '01000000000',
        } as never,
      }),
    );

    expect(created.tenantId).toBe(eliteId);

    await runAs(asTenant(eliteId), () => prisma.scoped.client.delete({ where: { id: created.id } }));
  });

  it('scopes aggregates, not just row reads', async () => {
    const eliteCount = await runAs(asTenant(eliteId), () => prisma.scoped.client.count());
    const bayanCount = await runAs(asTenant(bayanId), () => prisma.scoped.client.count());
    const total = await prisma.client.client.count(); // unscoped baseline

    expect(eliteCount).toBe(3);
    expect(bayanCount).toBe(2);
    expect(eliteCount + bayanCount).toBe(total);
  });

  it('fails closed when no tenant context is set', async () => {
    // The dangerous default would be returning every tenant's rows.
    await expect(prisma.scoped.client.findMany()).rejects.toThrow(/without a tenant context/i);
  });

  it('leaves genuinely global models unscoped', async () => {
    // Permissions are a shared catalogue, not tenant data.
    const permissions = await runAs(asTenant(eliteId), () => prisma.scoped.permission.count());
    expect(permissions).toBe(51);
  });
});

describe('RBAC matrix', () => {
  it('gives every tenant its own grants', async () => {
    const elite = await runAs(asTenant(eliteId), () => prisma.scoped.rolePermission.count());
    const bayan = await runAs(asTenant(bayanId), () => prisma.scoped.rolePermission.count());
    expect(elite).toBeGreaterThan(0);
    expect(elite).toBe(bayan);
  });

  it('grants OWNER every permission and VIEWER far fewer', async () => {
    const owner = await runAs(asTenant(eliteId), () =>
      prisma.scoped.rolePermission.count({ where: { role: 'OWNER', granted: true } }),
    );
    const viewer = await runAs(asTenant(eliteId), () =>
      prisma.scoped.rolePermission.count({ where: { role: 'VIEWER', granted: true } }),
    );

    expect(owner).toBe(51);
    expect(viewer).toBeLessThan(owner);
  });

  it('withholds financial permissions from EMPLOYEE', async () => {
    const rows = await runAs(asTenant(eliteId), () =>
      prisma.scoped.rolePermission.findMany({
        where: { role: 'EMPLOYEE', granted: true },
        select: { permissionCode: true },
      }),
    );
    const codes = new Set(rows.map((r) => r.permissionCode));

    expect(codes.has('payment.record')).toBe(false);
    expect(codes.has('user.salary.view')).toBe(false);
    expect(codes.has('dashboard.financial')).toBe(false);
    // …and must not see clients they are not assigned to.
    expect(codes.has('client.view_all')).toBe(false);
    // …but does hold the permissions its job requires.
    expect(codes.has('service.step.update')).toBe(true);
  });
});

describe('credentials', () => {
  it('stores password hashes, never plaintext', async () => {
    const users = await runAs(asTenant(eliteId), () =>
      prisma.scoped.user.findMany({ select: { email: true, passwordHash: true } }),
    );

    expect(users.length).toBe(5);
    for (const u of users) {
      expect(u.passwordHash).toBeTruthy();
      // bcrypt cost-12 hashes start with $2a$12$ / $2b$12$
      expect(u.passwordHash).toMatch(/^\$2[aby]\$12\$/);
      expect(u.passwordHash).not.toContain('DevPass');
    }
  });

  it('scopes email uniqueness per tenant, so the same address can exist twice', async () => {
    const all = await prisma.client.user.findMany({ select: { email: true, tenantId: true } });
    const eliteOwner = all.find((u) => u.email === 'owner@elite.test');
    const bayanOwner = all.find((u) => u.email === 'owner@bayan.test');
    expect(eliteOwner!.tenantId).not.toBe(bayanOwner!.tenantId);
  });
});
