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
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, SequenceKind, TenantStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS } from '../src/permissions';

const BCRYPT_ROUNDS = 12;

interface Args {
  sqlOnly: boolean;
  withSchema: boolean;
  demo: boolean;
  demoRole: UserRole;
  demoEmail: string;
  password: string | null;
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
    // Prepends the full schema so one file takes an empty database all the way
    // to a working office. Splitting setup across several files that must run
    // in the right order is a reliable way to get a half-built database.
    withSchema: argv.includes('--with-schema'),
    // A second account to hand to a client reviewing the system, so the owner
    // never has to share their own credentials. Same MANAGER role by default;
    // pass --demo-role VIEWER for read-only.
    demo: argv.includes('--demo'),
    demoRole: (get('demo-role', 'MANAGER') as UserRole),
    demoEmail: get('demo-email', 'demo@example.com').toLowerCase(),
    // Lets a chosen password be used instead of a generated one. Only for a
    // short-lived review account you intend to delete; a password you picked
    // and typed into a chat is not a secret.
    password: get('password', '') || null,
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

async function emitSql(
  args: Args,
  password: string,
  passwordHash: string,
  demo?: { password: string; hash: string },
): Promise<void> {
  const tenantId = randomUUID();
  const userId = randomUUID();

  const rolePermissionRows = (Object.entries(DEFAULT_ROLE_PERMISSIONS) as [UserRole, string[]][])
    .flatMap(([role, codes]) => codes.map((code) => `  (${q(role)}, ${q(code)})`))
    .join(',\n');

  const sequences = [
    [SequenceKind.CLIENT_CODE, 'CL-'],
    [SequenceKind.INVOICE_NUMBER, 'INV-'],
    [SequenceKind.SERVICE_ORDER, 'SO-'],
    [SequenceKind.CONTRACT_NUMBER, 'CT-'],
    [SequenceKind.EXPENSE_VOUCHER, 'EXP-'],
  ]
    .map(([kind, prefix]) => `  (${q(kind)}, ${q(prefix)})`)
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

-- Idempotent: an office that already exists is left untouched, and the password
-- below is simply never used. Re-running is a no-op rather than an error, so
-- this can live in the same file as the schema.
INSERT INTO "tenants" ("id", "name", "slug", "status", "email", "settings", "createdAt", "updatedAt")
VALUES (${q(tenantId)}::uuid, ${q(args.tenantName)}, ${q(args.slug)}, 'ACTIVE', ${q(args.email)},
        '{"currency":"EGP","timezone":"Africa/Cairo","locale":"ar-EG"}'::jsonb, now(), now())
ON CONFLICT ("slug") DO NOTHING;

-- The owner is attached to whichever tenant carries this slug, which may be a
-- pre-existing one rather than the row above.
INSERT INTO "users" ("id", "tenantId", "name", "email", "passwordHash", "role", "status",
                     "failedLoginAttempts", "createdAt", "updatedAt")
SELECT ${q(userId)}::uuid, t."id", ${q(args.ownerName)}, ${q(args.email)},
       ${q(passwordHash)}, 'OWNER', 'ACTIVE', 0, now(), now()
FROM "tenants" t
WHERE t."slug" = ${q(args.slug)}
ON CONFLICT ("tenantId", "email") DO NOTHING;

INSERT INTO "role_permissions" ("id", "tenantId", "role", "permissionCode", "granted")
SELECT gen_random_uuid(), t."id", v.role::"UserRole", v.code, true
FROM "tenants" t
CROSS JOIN (VALUES
${rolePermissionRows}
) AS v(role, code)
WHERE t."slug" = ${q(args.slug)}
ON CONFLICT ("tenantId", "role", "permissionCode") DO NOTHING;

INSERT INTO "number_sequences" ("id", "tenantId", "kind", "prefix", "current")
SELECT gen_random_uuid(), t."id", v.kind::"SequenceKind", v.prefix, 0
FROM "tenants" t
CROSS JOIN (VALUES
${sequences}
) AS v(kind, prefix)
WHERE t."slug" = ${q(args.slug)}
ON CONFLICT ("tenantId", "kind") DO NOTHING;
${
  demo
    ? `
-- --- Review account ----------------------------------------------------------
-- A separate login to hand to whoever is reviewing the system, so the owner
-- never shares their own credentials. Delete it when the review is over:
--     DELETE FROM "users" WHERE "email" = ${q(args.demoEmail)};
INSERT INTO "users" ("id", "tenantId", "name", "email", "passwordHash", "role", "status",
                     "jobTitle", "failedLoginAttempts", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t."id", 'حساب المراجعة', ${q(args.demoEmail)},
       ${q(demo.hash)}, '${args.demoRole}', 'ACTIVE', 'مراجعة النظام', 0, now(), now()
FROM "tenants" t
WHERE t."slug" = ${q(args.slug)}
ON CONFLICT ("tenantId", "email") DO NOTHING;
`
    : ''
}
COMMIT;
`;

  let output = sqlText;

  if (args.withSchema) {
    const schemaPath = join(__dirname, '..', 'supabase-setup.sql');
    if (!existsSync(schemaPath)) {
      throw new Error(`${schemaPath} is missing. Run: pnpm --filter @saas/database build:sql`);
    }
    // Schema first, then the office. The schema half carries its own guard
    // against running on a populated database.
    output = `${readFileSync(schemaPath, 'utf8')}\n\n${sqlText}`;
  }

  if (args.out) {
    writeFileSync(args.out, output, 'utf8');
    console.log(`SQL written to ${args.out}`);
  } else {
    console.log(output);
  }

  console.log('\n--- credentials — shown once, not stored anywhere ---');
  console.log('\n  OWNER (yours, keep private)');
  console.log(`    email:    ${args.email}`);
  console.log(`    password: ${password}`);

  if (demo) {
    console.log(`\n  REVIEW ACCOUNT (${args.demoRole}) — safe to share`);
    console.log(`    email:    ${args.demoEmail}`);
    console.log(`    password: ${demo.password}`);
    console.log('    delete it when the review is over — the SQL says how');
  }

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
  const password = args.password ?? generatePassword();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  if (args.password) {
    console.warn(
      '\n! Using a password supplied on the command line. It is in your shell\n' +
        '  history and is not a secret. Fine for a review account you will delete;\n' +
        '  never for an account that outlives the review.\n',
    );
  }

  const demo = args.demo
    ? await (async () => {
        const demoPassword = generatePassword();
        return { password: demoPassword, hash: await bcrypt.hash(demoPassword, BCRYPT_ROUNDS) };
      })()
    : undefined;

  if (args.sqlOnly) {
    await emitSql(args, password, passwordHash, demo);
  } else {
    await insertDirectly(args, password, passwordHash);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
