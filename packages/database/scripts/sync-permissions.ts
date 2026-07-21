/**
 * Seeds the `permissions` catalogue into the database.
 *
 * The API does this on every boot, but role_permissions has a foreign key onto
 * it — so anything that provisions a tenant before the API has ever started
 * (create-owner, a fresh SQL setup) needs the catalogue in place first.
 *
 * Idempotent: upserts by code and retires codes no longer in the catalogue.
 */
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSION_CODES, PERMISSION_CATALOG } from '../src/permissions';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.$transaction(
    PERMISSION_CATALOG.map((p, index) =>
      prisma.permission.upsert({
        where: { code: p.code },
        create: { ...p, sortOrder: index },
        update: { ...p, sortOrder: index },
      }),
    ),
  );

  const removed = await prisma.permission.deleteMany({
    where: { code: { notIn: ALL_PERMISSION_CODES } },
  });

  console.log(`Permissions synced: ${PERMISSION_CATALOG.length} active, ${removed.count} retired.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
