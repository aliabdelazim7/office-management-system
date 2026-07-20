/**
 * Vercel serverless entry point for the NestJS API.
 *
 * Vercel runs each request in a short-lived function, so the Nest application
 * is built once per warm container and reused. Rebuilding it per request would
 * open a new database connection every time and exhaust Supabase's pool within
 * seconds.
 *
 * Imports the COMPILED output rather than src/: Vercel's TypeScript handling
 * for `api/` functions does not apply our tsconfig, and Nest depends on
 * `emitDecoratorMetadata`. `pnpm build:api` runs first (see vercel.json).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppModule } = require('../dist/app.module');

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let cached: Handler | null = null;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  const config = app.get(ConfigService).get('app');

  app.setGlobalPrefix(config.apiPrefix);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.set('trust proxy', 1);

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  await app.init();
  return app.getHttpAdapter().getInstance() as unknown as Handler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  cached ??= await bootstrap();
  cached(req, res);
}
