import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import type { TenantContext } from '../../tenancy/tenant-context';

/** Marks a route as reachable without authentication. Use sparingly. */
export const IS_PUBLIC_KEY = 'auth:isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Requires ALL listed permission codes. Absence of this decorator on a
 * non-public route is itself a failure — see `PermissionsGuard`, which denies
 * by default rather than allowing anything that forgot to declare a need.
 */
export const PERMISSIONS_KEY = 'auth:permissions';
export const RequirePermissions = (...codes: string[]) => SetMetadata(PERMISSIONS_KEY, codes);

/**
 * Declares that a route needs authentication but no specific permission —
 * `/auth/me`, `/auth/logout`, a user's own notification feed.
 *
 * This exists so "no permission required" is an explicit, greppable statement
 * rather than indistinguishable from a forgotten decorator.
 */
export const AUTH_ONLY_KEY = 'auth:authenticatedOnly';
export const AuthenticatedOnly = () => SetMetadata(AUTH_ONLY_KEY, true);

/** Restricts a route to specific roles, independent of the permission matrix. */
export const ROLES_KEY = 'auth:roles';
export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Records this route's mutations to the audit log. */
export const AUDIT_KEY = 'audit:entity';
export const Audited = (entityType: string) => SetMetadata(AUDIT_KEY, entityType);

/** Injects the authenticated request context. */
export const CurrentUser = createParamDecorator(
  (field: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const context: TenantContext | undefined = request.tenantContext;
    return field ? context?.[field] : context;
  },
);

/** Injects the active tenant id. */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenantContext?.tenantId;
});
