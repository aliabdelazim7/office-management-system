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
--  Paste into the Supabase SQL Editor and run once, on a NEW project.
--
--  Creates ${migrations.length === 1 ? 'the schema' : `${migrations.length} migrations`}, then registers them in _prisma_migrations so a later
--  \`prisma migrate deploy\` recognises them as applied rather than trying to
--  create everything a second time.
--
--  Safe to run: aborts if the schema already contains tables. It never drops
--  anything. If you need a clean slate, do it deliberately in the SQL editor:
--      DROP SCHEMA public CASCADE; CREATE SCHEMA public;
--      GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
--
--  Seeds the ${PERMISSION_CATALOG.length} permission definitions. It does NOT create tenants or
--  users — sign up through the API (POST /api/v1/auth/register-tenant) so the
--  owner password is hashed with bcrypt rather than written here in the clear.
-- =============================================================================

BEGIN;

-- --- Guard ------------------------------------------------------------------
-- Refuse to run on a populated schema rather than silently colliding.
DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '\\_prisma%'
  ) THEN
    RAISE EXCEPTION
      'Schema "public" is not empty. This script only initialises a fresh database. Drop the schema first if that is what you intend.';
  END IF;
END
$guard$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`);

  for (const name of migrations) {
    const file = join(migrationsDir, name, 'migration.sql');
    const body = readFileSync(file, 'utf8').replace(/^﻿/, '');

    parts.push(`
-- =============================================================================
--  Migration: ${name}
-- =============================================================================

${body.trim()}
`);
  }

  // -- Prisma bookkeeping -----------------------------------------------------
  parts.push(`
-- =============================================================================
--  Prisma migration history
-- =============================================================================
--  Tells Prisma these migrations are already applied. Omitting this is what
--  makes a manual SQL setup and \`migrate deploy\` fight each other.

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
`);

  for (const name of migrations) {
    const body = readFileSync(join(migrationsDir, name, 'migration.sql'), 'utf8').replace(
      /^﻿/,
      '',
    );
    const checksum = createHash('sha256').update(body).digest('hex');

    parts.push(`INSERT INTO "_prisma_migrations"
  ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
VALUES
  (gen_random_uuid()::text, ${sql(checksum)}, now(), ${sql(name)}, now(), 1)
ON CONFLICT DO NOTHING;
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
}

main();
