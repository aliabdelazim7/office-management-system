import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import { AUTH_ONLY_KEY, IS_PUBLIC_KEY, PERMISSIONS_KEY, ROLES_KEY } from '../decorators';
import type { TenantContext } from '../../tenancy/tenant-context';

/**
 * Deny-by-default authorisation.
 *
 * A non-public route with no `@RequirePermissions` is treated as a mistake and
 * refused. The alternative — allowing undeclared routes — means a forgotten
 * decorator silently ships an open endpoint, and that failure is invisible in
 * review because the code looks like every other controller.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const ctx: TenantContext | undefined = request.tenantContext;
    if (!ctx) {
      throw new ForbiddenException('سياق المصادقة غير متاح');
    }

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(ctx.role as UserRole)) {
      throw new ForbiddenException('هذه العملية غير متاحة لدورك الوظيفي');
    }

    const authOnly = this.reflector.getAllAndOverride<boolean>(AUTH_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (authOnly) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // A role restriction alone is a sufficient, explicit declaration.
    if (!required?.length) {
      if (roles?.length) return true;
      throw new ForbiddenException(
        `المسار ${context.getClass().name}.${context.getHandler().name} لا يعلن الصلاحيات المطلوبة`,
      );
    }

    const missing = required.filter((code) => !ctx.permissions.has(code));
    if (missing.length) {
      throw new ForbiddenException(`صلاحيات غير كافية: ${missing.join('، ')}`);
    }

    return true;
  }
}
