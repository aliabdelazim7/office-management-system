import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../../tenancy/tenant-context';

/**
 * Binds the request's tenant context to AsyncLocalStorage for the remainder of
 * the request. Runs after guards (which populate `request.tenantContext`) and
 * before the handler, so every service and every Prisma call downstream sees
 * the tenant without being handed it explicitly.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const ctx = request.tenantContext;

    if (!ctx) {
      // Public route — no tenant. The Prisma extension fails closed if a
      // tenant-scoped query is nonetheless attempted.
      return next.handle();
    }

    // `run()` would exit before the returned observable is subscribed, taking
    // the store with it and leaving every downstream query unscoped.
    this.tenantContext.enter(ctx);
    return next.handle();
  }
}
