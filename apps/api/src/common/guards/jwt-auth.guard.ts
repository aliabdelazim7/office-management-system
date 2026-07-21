import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { TenantStatus, UserStatus } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from '../../rbac/rbac.service';
import type { TenantContext } from '../../tenancy/tenant-context';
import type { AppConfig } from '../../config/configuration';

export interface AccessTokenPayload {
  sub: string; // userId
  tid: string; // tenantId
  role: string;
  jti: string;
}

/**
 * Authenticates the request and establishes the tenant context.
 *
 * The tenant comes from the token and nowhere else. There is deliberately no
 * `X-Tenant-ID` header path: a client-supplied tenant that is resolved before
 * (or independently of) authentication is the standard way multi-tenant systems
 * leak, and no amount of downstream query discipline reliably compensates.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('مطلوب تسجيل الدخول');
    }

    const appConfig = this.config.get<AppConfig>('app')!;

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: appConfig.jwt.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('انتهت صلاحية الجلسة');
    }

    // Re-read the user on every request. A token issued before a suspension or
    // a role change must not outlive that change by its full TTL.
    const user = await this.prisma.unsafeUnscoped.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        role: true,
        status: true,
        tenant: { select: { status: true, deletedAt: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('الحساب غير موجود');
    }

    // The token's tenant claim must match the user's actual tenant. If these
    // ever disagree the token was forged or replayed across tenants.
    if (user.tenantId !== payload.tid) {
      throw new ForbiddenException('عدم تطابق بيانات الجلسة');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('الحساب غير مفعّل');
    }

    if (user.tenant.deletedAt || user.tenant.status === TenantStatus.SUSPENDED || user.tenant.status === TenantStatus.CANCELLED) {
      throw new ForbiddenException('حساب المكتب موقوف');
    }

    const permissions = await this.rbac.getEffectivePermissions(user.tenantId, user.id, user.role);

    const tenantContext: TenantContext = {
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      permissions,
      requestId: request.headers['x-request-id'] ?? randomUUID(),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };

    request.tenantContext = tenantContext;
    return true;
  }

  private extractToken(header?: string): string | null {
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && value ? value : null;
  }
}
