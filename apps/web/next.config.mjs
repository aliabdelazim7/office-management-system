import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// `new URL(...).pathname` yields "/E:/..." on Windows, which is not a valid
// filesystem path. fileURLToPath is the only correct conversion.
const monorepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // `@saas/types` ships TypeScript source rather than a build artifact, so Next
  // has to compile it alongside the app.
  transpilePackages: ['@saas/types'],

  // The monorepo root, not apps/web, is what Next should trace files from.
  // Without this it guesses, and on a pnpm workspace it guesses wrong.
  outputFileTracingRoot: monorepoRoot,

  eslint: {
    // Linting runs in CI, not as a deploy gate.
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
