import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// `new URL(...).pathname` yields "/E:/..." on Windows, which is not a valid
// filesystem path. fileURLToPath is the only correct conversion.
const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Only @saas/types. The web app must never pull in @saas/database: that
  // would bundle Prisma into the frontend and, worse, make an unscoped client
  // reachable from code that has no tenant context.
  transpilePackages: ['@saas/types'],

  // The monorepo root, not apps/web, is what Next should trace files from.
  outputFileTracingRoot: monorepoRoot,

  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
