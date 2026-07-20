import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService).get<AppConfig>('app')!;

  app.setGlobalPrefix(config.apiPrefix);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  // `trust proxy` so `req.ip` is the real client behind a load balancer —
  // rate limiting and audit logs are worthless if every request looks like it
  // came from the proxy.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true, // and reject when they are sent
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  if (!config.isProduction) {
    const doc = new DocumentBuilder()
      .setTitle('Office ERP API')
      .setDescription('نظام إدارة المكتب المتكامل — واجهة برمجة التطبيقات')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));
    logger.log(`Swagger UI: http://localhost:${config.port}/docs`);
  }

  app.enableShutdownHooks();

  await app.listen(config.port);
  logger.log(`API listening on http://localhost:${config.port}/${config.apiPrefix} [${config.nodeEnv}]`);
}

void bootstrap();
