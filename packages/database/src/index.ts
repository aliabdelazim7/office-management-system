// Ensure DATABASE_URL and DIRECT_URL fall back to Vercel Postgres / Supabase Vercel Integration variables
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_URL ||
    'file:./dev.db';
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;
}

export * from '@prisma/client';

/**
 * The permission catalogue lives here rather than in the API so that the API,
 * the seed script, and any future worker all read one definition.
 */
export * from './permissions';
