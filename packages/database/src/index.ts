/**
 * Maps the connection-string aliases that hosting integrations inject
 * (Vercel Postgres, the Supabase Vercel integration) onto the names Prisma
 * expects.
 *
 * There is deliberately NO fallback to a local SQLite file. A missing
 * DATABASE_URL has to fail loudly at startup — falling back means a production
 * deploy silently connects to a database that does not exist, and the failure
 * surfaces much later as "no rows found" rather than "you forgot a secret".
 */
process.env.DATABASE_URL ||= process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || '';

process.env.DIRECT_URL ||= process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || '';

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
