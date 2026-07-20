export * from '@prisma/client';

/**
 * The permission catalogue lives here rather than in the API so that the API,
 * the seed script, and any future worker all read one definition. Duplicating
 * it per consumer is how a permission matrix silently drifts out of sync.
 */
export * from './permissions';

// NOTE: no shared `PrismaClient` singleton is exported. The API owns its client
// (see apps/api/src/prisma/prisma.service.ts) because that instance carries the
// tenant-isolation extension. Handing out a bare client here would give callers
// an easy, unscoped way around isolation.
