import { z } from 'zod';

/**
 * Environment schema. The app refuses to boot on invalid config rather than
 * failing at the first request — a missing JWT secret must be a startup crash,
 * never a runtime fallback to a hardcoded default.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('api/v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  AUTH_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(10),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./storage'),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
});

export type AppConfig = ReturnType<typeof loadConfiguration>;

export function loadConfiguration() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env = parsed.data;

  if (env.NODE_ENV === 'production' && env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ in production.');
  }

  return {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.API_PORT,
    apiPrefix: env.API_PREFIX,
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTtl: env.JWT_ACCESS_TTL,
      refreshTtl: env.JWT_REFRESH_TTL,
    },
    auth: {
      maxFailedAttempts: env.AUTH_MAX_FAILED_ATTEMPTS,
      lockoutMinutes: env.AUTH_LOCKOUT_MINUTES,
    },
    corsOrigins: env.CORS_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    throttle: {
      ttlSeconds: env.THROTTLE_TTL_SECONDS,
      limit: env.THROTTLE_LIMIT,
      authLimit: env.THROTTLE_AUTH_LIMIT,
    },
    storage: {
      driver: env.STORAGE_DRIVER,
      localPath: env.STORAGE_LOCAL_PATH,
      maxBytes: env.UPLOAD_MAX_BYTES,
    },
  };
}
