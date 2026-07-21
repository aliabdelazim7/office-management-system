-- =============================================================================
--  Migration: 20260721090000_user_permission_overrides
-- =============================================================================
--
--  GENERATED FILE — do not edit.
--  Regenerate: pnpm --filter @saas/database build:sql
--
--  For a database that ALREADY has the schema. Paste into the Supabase SQL
--  Editor. Safe to run twice: it aborts if this migration is already recorded.
--
--  For a brand new database use supabase-setup.sql instead, which contains
--  every migration in order.
-- =============================================================================

BEGIN;

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "_prisma_migrations"
    WHERE "migration_name" = '20260721090000_user_permission_overrides' AND "finished_at" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Migration 20260721090000_user_permission_overrides is already applied. Nothing to do.';
  END IF;
END
$guard$;

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedById" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_permissions_tenantId_userId_idx" ON "user_permissions"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionCode_key" ON "user_permissions"("userId", "permissionCode");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionCode_fkey" FOREIGN KEY ("permissionCode") REFERENCES "permissions"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "_prisma_migrations"
  ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
VALUES
  (gen_random_uuid()::text, '429ff2c66a83682e87b0e1f30d8d47037fc292b6c5d8b242a9c3677ce1795d86', now(), '20260721090000_user_permission_overrides', now(), 1);

COMMIT;
