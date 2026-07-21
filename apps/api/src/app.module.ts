import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { loadConfiguration, type AppConfig } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { RbacModule } from './rbac/rbac.module';
import { AuthModule } from './auth/auth.module';
import { TeamModule } from './team/team.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Validate once, at boot, and expose the parsed result under `app`.
      load: [() => ({ app: loadConfiguration() })],
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const app = config.get<AppConfig>('app')!;
        return {
          throttlers: [
            { name: 'default', ttl: app.throttle.ttlSeconds * 1000, limit: app.throttle.limit },
            // Named bucket used by @Throttle on auth routes.
            { name: 'auth', ttl: 60_000, limit: app.throttle.authLimit },
          ],
        };
      },
    }),

    JwtModule.register({ global: true }),
    ScheduleModule.forRoot(),

    TenancyModule,
    PrismaModule,
    RbacModule,
    AuthModule,
    TeamModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: throttle, then authenticate, then authorise.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
