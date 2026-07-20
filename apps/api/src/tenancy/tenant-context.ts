import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

/**
 * The identity of the caller for the duration of one request.
 *
 * `tenantId` is derived from the *authenticated JWT*, never from a header.
 * Accepting `X-Tenant-ID` from the client and resolving it before auth is the
 * classic multi-tenant break — it lets anyone with a valid token in tenant A
 * address tenant B and rely on nothing but query-authoring discipline to stop
 * them. We do not offer that surface.
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  permissions: ReadonlySet<string>;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Ambient request context. Held in AsyncLocalStorage so the Prisma extension
 * can read the tenant without every service threading it through by hand — the
 * moment isolation depends on a parameter someone can forget to pass, it is a
 * matter of time before someone forgets.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantContext>();

  /** Run `fn` with `ctx` bound to the current async execution path. */
  run<T>(ctx: TenantContext, fn: () => T): T {
    return this.als.run(ctx, fn);
  }

  /** The active context, or undefined on unauthenticated/system paths. */
  get(): TenantContext | undefined {
    return this.als.getStore();
  }

  /**
   * The active tenant id, or undefined when running outside a request
   * (bootstrap, cron jobs, seeds). Callers that require a tenant should use
   * `requireTenantId()`.
   */
  get tenantId(): string | undefined {
    return this.als.getStore()?.tenantId;
  }

  requireTenantId(): string {
    const id = this.tenantId;
    if (!id) {
      throw new Error(
        'TenantContext is not set. A tenant-scoped operation ran outside an authenticated request.',
      );
    }
    return id;
  }

  get userId(): string | undefined {
    return this.als.getStore()?.userId;
  }

  hasPermission(code: string): boolean {
    return this.als.getStore()?.permissions.has(code) ?? false;
  }
}
