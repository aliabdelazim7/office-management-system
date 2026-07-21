/**
 * Generates `supabase-setup.sql` — a single file that brings an empty Supabase
 * project to exactly the state `prisma migrate deploy` would produce.
 *
 * Generated, never hand-written. A hand-maintained SQL file is a second source
 * of truth for the schema, and this repository has already been broken twice by
 * one drifting from prisma/schema.prisma.
 *
 * Two properties make the output safe to run:
 *
 *   1. It records the migration in `_prisma_migrations` with the checksum
 *      Prisma computes. Without that row, a later `migrate deploy` tries to
 *      re-create every table and fails; with it, Prisma sees the migration as
 *      already applied and moves on.
 *
 *   2. It refuses to run against a non-empty schema instead of dropping
 *      anything. The previous hand-written script opened with
 *      `DROP TYPE ... CASCADE`, which drops every column using that type — that
 *      is how clients.legalType disappeared from an already-correct database.
 *
 * Run with: pnpm --filter @saas/database build:sql
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PERMISSION_CATALOG } from '../src/permissions';

const packageRoot = resolve(__dirname, '..');
const migrationsDir = join(packageRoot, 'prisma', 'migrations');
const outputPath = join(packageRoot, 'supabase-setup.sql');

/** Postgres string literal, single quotes doubled. */
function sql(value: string | null | undefined): string {
  if (value === null || value === undefined) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function main(): void {
  const migrations = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  if (migrations.length === 0) {
    throw new Error('No migrations found. Run `pnpm db:migrate` first.');
  }

  const parts: string[] = [];

  parts.push(`-- =============================================================================
--  Office ERP — complete Supabase setup
-- =============================================================================
--
--  GENERATED FILE — do not edit.
--  Source: packages/database/prisma/migrations/
--  Regenerate: pnpm --filter @saas/database build:sql
--
--  Paste into the Supabase SQL Editor and run.
--
--  IDEMPOTENT. Each migration is wrapped in a check against _prisma_migrations
--  and skipped if already recorded, so this file is safe on an empty project,
--  on a partially-built one, and on a fully-built one. Running it twice is a
--  no-op.
--
--  An earlier version refused outright when the schema was non-empty, which was
--  safe but useless: a database built from an older copy of this file then had
--  no way forward except dropping everything.
--
--  It never drops anything. For a deliberate clean slate:
--      DROP SCHEMA public CASCADE; CREATE SCHEMA public;
--      GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
--
--  Seeds the ${PERMISSION_CATALOG.length} permission definitions.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --- Prisma migration history ------------------------------------------------
-- Created first: everything below checks it. Recording each migration here is
-- what stops a later \`prisma migrate deploy\` from trying to build the schema a
-- second time.
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    VARCHAR(36)  PRIMARY KEY,
  "checksum"              VARCHAR(64)  NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        VARCHAR(255) NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "applied_steps_count"   INTEGER      NOT NULL DEFAULT 0
);

-- A database built by an older copy of this file has the tables but no history
-- rows. Backfill from what actually exists, so those migrations are not
-- attempted again.
INSERT INTO "_prisma_migrations"
  ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT gen_random_uuid()::text, 'backfilled', now(), ${sql(migrations[0])}, now(), 1
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants')
  AND NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = ${sql(migrations[0])}
  );
`);

  for (const name of migrations) {
    const file = join(migrationsDir, name, 'migration.sql');
    const body = readFileSync(file, 'utf8').replace(/^﻿/, '');
    const checksum = createHash('sha256').update(body).digest('hex');
    // Dollar-quote tag unique per migration, so a nested $$ in the DDL cannot
    // terminate the block early.
    const tag = `$mig_${name}$`;

    parts.push(`
-- =============================================================================
--  Migration: ${name}
-- =============================================================================

DO ${tag}
BEGIN
  IF EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = ${sql(name)}
  ) THEN
    RAISE NOTICE 'Skipping ${name} — already applied.';
    RETURN;
  END IF;

${body
  .trim()
  .split('\n')
  .map((line) => (line.trim() ? `  ${line}` : line))
  .join('\n')}

  INSERT INTO "_prisma_migrations"
    ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
  VALUES (gen_random_uuid()::text, ${sql(checksum)}, now(), ${sql(name)}, now(), 1);

  RAISE NOTICE 'Applied ${name}.';
END
${tag};
`);
  }

  // -- Permission catalogue ---------------------------------------------------
  parts.push(`
-- =============================================================================
--  Permission catalogue (${PERMISSION_CATALOG.length} permissions)
-- =============================================================================
--  Mirrors packages/database/src/permissions.ts. The API re-syncs this table on
--  every boot, so it self-heals if it drifts.

INSERT INTO "permissions" ("code", "groupKey", "groupLabel", "labelAr", "labelEn", "description", "sortOrder")
VALUES`);

  const rows = PERMISSION_CATALOG.map(
    (p, i) =>
      `  (${sql(p.code)}, ${sql(p.groupKey)}, ${sql(p.groupLabel)}, ${sql(p.labelAr)}, ${sql(p.labelEn)}, ${sql(p.description)}, ${i})`,
  );

  parts.push(`${rows.join(',\n')}
ON CONFLICT ("code") DO UPDATE SET
  "groupKey"    = EXCLUDED."groupKey",
  "groupLabel"  = EXCLUDED."groupLabel",
  "labelAr"     = EXCLUDED."labelAr",
  "labelEn"     = EXCLUDED."labelEn",
  "description" = EXCLUDED."description",
  "sortOrder"   = EXCLUDED."sortOrder";

COMMIT;

-- =============================================================================
--  Done.
--
--  Next: create your office through the API so the password is hashed properly.
--
--    POST /api/v1/auth/register-tenant
--    { "tenantName": "مكتب النخبة", "tenantSlug": "elite",
--      "ownerName": "اسمك", "email": "you@example.com",
--      "password": "ChangeMe!2026" }
--
--  That one call provisions the tenant, the full role/permission matrix, the
--  numbering sequences, and the OWNER account.
-- =============================================================================
`);

  writeFileSync(outputPath, parts.join('\n'), 'utf8');

  const lines = parts.join('\n').split('\n').length;
  console.log(`Wrote ${outputPath}`);
  console.log(`  migrations : ${migrations.join(', ')}`);
  console.log(`  permissions: ${PERMISSION_CATALOG.length}`);
  console.log(`  lines      : ${lines}`);
  console.log('\nTo get a single file that also creates your office and owner:');
  console.log('  pnpm --filter @saas/database create-owner -- \\');
  console.log('    --sql --with-schema --out packages/database/SETUP.local.sql \\');
  console.log('    --slug <slug> --email <you@example.com>');
}

main();
