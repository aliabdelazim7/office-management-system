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

  /**
   * Bind `ctx` to the current async resource and everything it spawns.
   *
   * `run()` is not usable at the guard/interceptor boundary: it returns as soon
   * as its callback returns, and both Prisma promises and RxJS observables are
   * lazy — the work starts when they are awaited or subscribed, by which point
   * `run()` has already exited and the store is gone. `enterWith` has no such
   * exit, so the context survives to the point the query actually executes.
   */
  enter(ctx: TenantContext): void {
    this.als.enterWith(ctx);
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
