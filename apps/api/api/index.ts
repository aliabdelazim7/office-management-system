/**
 * Vercel serverless entry for the NestJS API.
 *
 * The Nest application is built once per warm container and cached. Building it
 * per request would open a fresh Postgres connection every time and exhaust
 * Supabase's pool within seconds of any real traffic.
 *
 * Imports the COMPILED output rather than `src/`: Vercel does not apply this
 * project's tsconfig to files under `api/`, and Nest depends on
 * `emitDecoratorMetadata`. `pnpm build:api` runs first — see vercel.json.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let cached: Promise<NodeHandler> | null = null;

async function bootstrap(): Promise<NodeHandler> {
  // Required at call time, not import time: a throw here must surface as a
  // logged 500 from the handler rather than a module-load crash, which Vercel
  // reports only as the opaque FUNCTION_INVOCATION_FAILED.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppModule } = require('../dist/app.module');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  const config = app.get(ConfigService).get('app');

  app.setGlobalPrefix(config.apiPrefix);
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
  return app.getHttpAdapter().getInstance() as unknown as NodeHandler;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    cached ??= bootstrap();
    const express = await cached;
    express(req, res);
  } catch (error) {
    // Reset so the next invocation retries instead of serving a poisoned cache.
    cached = null;
    // eslint-disable-next-line no-console
    console.error('Nest bootstrap failed:', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        statusCode: 500,
        message: 'تعذر تشغيل الخدمة',
        detail: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
