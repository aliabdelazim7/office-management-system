import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { TenantContextService } from '../tenancy/tenant-context';

/**
 * Models that legitimately live outside any tenant.
 * `Tenant` is the tenant row itself; `Permission` is a global catalogue.
 */
const GLOBAL_MODELS = new Set(['Tenant', 'Permission']);

/**
 * Every model that declares a `tenantId` scalar, derived from the generated
 * datamodel rather than hand-listed. A hand-maintained list is a list that
 * eventually drifts from the schema — and the failure mode of that drift is
 * silent cross-tenant data exposure.
 */
const TENANT_SCOPED_MODELS: ReadonlySet<string> = new Set(
  Prisma.dmmf.datamodel.models
    .filter((m) => m.fields.some((f) => f.name === 'tenantId' && f.kind === 'scalar'))
    .map((m) => m.name),
);

/** Operations whose `args.where` must be narrowed to the active tenant. */
const WHERE_SCOPED_OPS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
  'groupBy',
]);

export type ScopedPrismaClient = ReturnType<PrismaService['buildScopedClient']>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Tenant-scoped client. Every query is rewritten to include the active
   * tenant before it reaches the database. This is the *only* client that
   * feature modules should ever touch.
   */
  readonly scoped: ScopedPrismaClient;

  constructor(private readonly tenantContext: TenantContextService) {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
          : ['warn', 'error'],
    });
    this.scoped = this.buildScopedClient();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log(
      `Prisma connected. Tenant-scoped models: ${TENANT_SCOPED_MODELS.size}, global: ${GLOBAL_MODELS.size}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Escape hatch for the few operations that legitimately precede tenant
   * resolution — resolving a login by email, validating a refresh token,
   * accepting an invitation, and background jobs that sweep all tenants.
   *
   * Named to be conspicuous in review. Reach for `scoped` unless you can state
   * why the query cannot know its tenant yet.
   */
  get unsafeUnscoped(): PrismaClient {
    return this;
  }

  private buildScopedClient() {
    const ctx = this.tenantContext;

    return this.$extends({
      name: 'tenant-isolation',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!model || GLOBAL_MODELS.has(model) || !TENANT_SCOPED_MODELS.has(model)) {
              return query(args);
            }

            const tenantId = ctx.tenantId;
            if (!tenantId) {
              // Fail closed. An unscoped query against a tenant-scoped model is
              // a bug, and returning every tenant's rows is the worst possible
              // way to surface it.
              throw new InternalServerErrorException(
                `Refusing to run ${operation} on ${model} without a tenant context.`,
              );
            }

            const next = { ...(args as Record<string, unknown>) };

            if (WHERE_SCOPED_OPS.has(operation)) {
              next.where = { ...((next.where as object) ?? {}), tenantId };
            }

            if (operation === 'create') {
              next.data = { ...((next.data as object) ?? {}), tenantId };
            }

            if (operation === 'createMany' || operation === 'createManyAndReturn') {
              const data = next.data;
              next.data = Array.isArray(data)
                ? data.map((row) => ({ ...(row as object), tenantId }))
                : { ...((data as object) ?? {}), tenantId };
            }

            if (operation === 'upsert') {
              next.where = { ...((next.where as object) ?? {}), tenantId };
              next.create = { ...((next.create as object) ?? {}), tenantId };
            }

            return query(next);
          },
        },
      },
    });
  }
}
