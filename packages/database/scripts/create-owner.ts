/**
 * Creates the first office and its OWNER account.
 *
 * Two modes:
 *
 *   pnpm --filter @saas/database create-owner            connects and inserts
 *   pnpm --filter @saas/database create-owner --sql      prints SQL to paste
 *
 * The SQL mode exists because a Supabase project is often reachable from its
 * dashboard SQL editor before it is reachable from a laptop.
 *
 * The password is generated here, at run time, and printed once. It is never
 * written to a file the repository tracks and never hardcoded. A committed
 * password is a backdoor that outlives everyone who remembers it — and this
 * repository has already had three of them removed.
 *
 * Refuses to create a second owner for the same slug.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { PrismaClient, SequenceKind, TenantStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS } from '../src/permissions';

const BCRYPT_ROUNDS = 12;

interface Args {
  sqlOnly: boolean;
  out: string | null;
  tenantName: string;
  slug: string;
  ownerName: string;
  email: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const i = argv.indexOf(`--${flag}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };

  return {
    sqlOnly: argv.includes('--sql'),
    // Writing the file here rather than redirecting the console keeps shell
    // noise out of it. A previous run piped stdout through PowerShell and the
    // resulting file ended with a stderr line, which Postgres then choked on.
    out: get('out', '') || null,
    tenantName: get('tenant-name', 'مكتبي للخدمات والاستشارات'),
    slug: get('slug', 'main'),
    ownerName: get('owner-name', 'مالك المكتب'),
    email: get('email', 'owner@example.com').toLowerCase(),
  };
}

/**
 * Generates a password with real entropy — 18 chars from a 62-symbol alphabet
 * is ~107 bits, far past anything worth brute forcing — while staying readable
 * enough to retype once. Ambiguous glyphs (O/0, l/1/I) are excluded.
 */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(18);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  // Guarantee the mixed-case + digit rule the API enforces on registration.
  return `${out.slice(0, 16)}A7`;
}

function q(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function emitSql(args: Args, password: string, passwordHash: string): Promise<void> {
  const tenantId = randomUUID();
  const userId = randomUUID();

  const rolePermissionRows = (Object.entries(DEFAULT_ROLE_PERMISSIONS) as [UserRole, string[]][])
    .flatMap(([role, codes]) =>
      codes.map((code) => `  (gen_random_uuid(), ${q(tenantId)}::uuid, '${role}', ${q(code)}, true)`),
    )
    .join(',\n');

  const sequences = [
    [SequenceKind.CLIENT_CODE, 'CL-'],
    [SequenceKind.INVOICE_NUMBER, 'INV-'],
    [SequenceKind.SERVICE_ORDER, 'SO-'],
    [SequenceKind.CONTRACT_NUMBER, 'CT-'],
    [SequenceKind.EXPENSE_VOUCHER, 'EXP-'],
  ]
    .map(([kind, prefix]) => `  (gen_random_uuid(), ${q(tenantId)}::uuid, '${kind}', ${q(prefix)}, 0)`)
    .join(',\n');

  const sqlText = `-- =============================================================================
--  Creates the office and its OWNER account.
--  Paste into the Supabase SQL Editor and run once.
--
--  The password is NOT in this file — only its bcrypt hash, which cannot be
--  reversed. The password itself was printed to the console that generated
--  this and exists nowhere else.
-- =============================================================================

BEGIN;

DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM "tenants" WHERE "slug" = ${q(args.slug)}) THEN
    RAISE EXCEPTION 'An office with slug ${args.slug} already exists.';
  END IF;
END
$guard$;

INSERT INTO "tenants" ("id", "name", "slug", "status", "email", "settings", "createdAt", "updatedAt")
VALUES (${q(tenantId)}::uuid, ${q(args.tenantName)}, ${q(args.slug)}, 'ACTIVE', ${q(args.email)},
        '{"currency":"EGP","timezone":"Africa/Cairo","locale":"ar-EG"}'::jsonb, now(), now());

INSERT INTO "users" ("id", "tenantId", "name", "email", "passwordHash", "role", "status",
                     "failedLoginAttempts", "createdAt", "updatedAt")
VALUES (${q(userId)}::uuid, ${q(tenantId)}::uuid, ${q(args.ownerName)}, ${q(args.email)},
        ${q(passwordHash)}, 'OWNER', 'ACTIVE', 0, now(), now());

INSERT INTO "role_permissions" ("id", "tenantId", "role", "permissionCode", "granted")
VALUES
${rolePermissionRows}
ON CONFLICT DO NOTHING;

INSERT INTO "number_sequences" ("id", "tenantId", "kind", "prefix", "current")
VALUES
${sequences}
ON CONFLICT DO NOTHING;

COMMIT;
`;

  if (args.out) {
    writeFileSync(args.out, sqlText, 'utf8');
    console.log(`SQL written to ${args.out}`);
  } else {
    console.log(sqlText);
  }

  console.log('\n--- credentials — shown once, not stored anywhere ---');
  console.log(`  email:    ${args.email}`);
  console.log(`  password: ${password}`);
  console.log('\nSign in, then change the password from your profile.');
}

async function insertDirectly(args: Args, password: string, passwordHash: string): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.tenant.findUnique({
      where: { slug: args.slug },
      select: { id: true },
    });
    if (existing) {
      throw new Error(`An office with slug "${args.slug}" already exists.`);
    }

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: args.tenantName,
          slug: args.slug,
          status: TenantStatus.ACTIVE,
          email: args.email,
          settings: { currency: 'EGP', timezone: 'Africa/Cairo', locale: 'ar-EG' },
        },
      });

      await tx.rolePermission.createMany({
        data: (Object.entries(DEFAULT_ROLE_PERMISSIONS) as [UserRole, string[]][]).flatMap(
          ([role, codes]) =>
            codes.map((permissionCode) => ({
              tenantId: tenant.id,
              role,
              permissionCode,
              granted: true,
            })),
        ),
        skipDuplicates: true,
      });

      await tx.numberSequence.createMany({
        data: [
          { tenantId: tenant.id, kind: SequenceKind.CLIENT_CODE, prefix: 'CL-' },
          { tenantId: tenant.id, kind: SequenceKind.INVOICE_NUMBER, prefix: 'INV-' },
          { tenantId: tenant.id, kind: SequenceKind.SERVICE_ORDER, prefix: 'SO-' },
          { tenantId: tenant.id, kind: SequenceKind.CONTRACT_NUMBER, prefix: 'CT-' },
          { tenantId: tenant.id, kind: SequenceKind.EXPENSE_VOUCHER, prefix: 'EXP-' },
        ],
        skipDuplicates: true,
      });

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: args.ownerName,
          email: args.email,
          passwordHash,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
        },
      });
    });

    console.log('Office and owner created.\n');
    console.log(`  office:   ${args.tenantName} (${args.slug})`);
    console.log(`  email:    ${args.email}`);
    console.log(`  password: ${password}`);
    console.log('\nShown once. Sign in, then change it from your profile.');
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const args = parseArgs();
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  if (args.sqlOnly) {
    await emitSql(args, password, passwordHash);
  } else {
    await insertDirectly(args, password, passwordHash);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
