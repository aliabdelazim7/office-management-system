import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ALL_PERMISSION_CODES,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CATALOG,
  assertCatalogIntegrity,
} from './permission.catalog';

interface CacheEntry {
  permissions: ReadonlySet<string>;
  expiresAt: number;
}

/** Short TTL: a permission change should take effect in seconds, not minutes. */
const CACHE_TTL_MS = 30_000;

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    assertCatalogIntegrity();
    await this.syncCatalog();
  }

  /**
   * Reconcile the `permissions` table with the catalogue in code.
   * Idempotent, so it is safe on every boot — deliberately not a migration,
   * because a migration that mutates data drifts from a fresh `migrate deploy`
   * and cannot be re-run.
   */
  async syncCatalog(): Promise<void> {
    await this.prisma.$transaction(
      PERMISSION_CATALOG.map((p, index) =>
        this.prisma.client.permission.upsert({
          where: { code: p.code },
          create: { ...p, sortOrder: index },
          update: {
            groupKey: p.groupKey,
            groupLabel: p.groupLabel,
            labelAr: p.labelAr,
            labelEn: p.labelEn,
            description: p.description,
            sortOrder: index,
          },
        }),
      ),
    );

    // Remove codes that no longer exist in the catalogue. Cascades to
    // role_permissions and user_permissions so nothing keeps a dead grant.
    const removed = await this.prisma.client.permission.deleteMany({
      where: { code: { notIn: ALL_PERMISSION_CODES } },
    });

    this.logger.log(
      `Permission catalogue synced: ${PERMISSION_CATALOG.length} active, ${removed.count} retired.`,
    );
  }

  /**
   * Provision the default permission matrix for a tenant.
   * Call inside the same transaction that creates the tenant.
   */
  async provisionTenant(
    tenantId: string,
    tx: Prisma.TransactionClient | PrismaClient = this.prisma.client,
  ): Promise<void> {
    const rows = (Object.entries(DEFAULT_ROLE_PERMISSIONS) as [UserRole, string[]][]).flatMap(
      ([role, codes]) =>
        codes.map((permissionCode) => ({ tenantId, role, permissionCode, granted: true })),
    );

    await tx.rolePermission.createMany({ data: rows, skipDuplicates: true });
  }

  /** Permissions a role grants within a tenant, before per-user overrides. */
  async getRolePermissions(tenantId: string, role: UserRole | string): Promise<ReadonlySet<string>> {
    const key = `role:${tenantId}:${role}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const rows = await this.prisma.unsafeUnscoped.rolePermission.findMany({
      where: { tenantId, role: role as UserRole, granted: true },
      select: { permissionCode: true },
    });

    let permissions: ReadonlySet<string>;

    if (rows.length === 0) {
      // No matrix yet (provisioning interrupted, or a row predating it). Fall
      // back to the role defaults rather than locking the user out — but never
      // widen beyond the default.
      this.logger.warn(`No permission matrix for tenant ${tenantId} role ${role}; using defaults.`);
      permissions = new Set(DEFAULT_ROLE_PERMISSIONS[role as UserRole] ?? []);
    } else {
      permissions = new Set(rows.map((r) => r.permissionCode));
    }

    this.cache.set(key, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
    return permissions;
  }

  /**
   * Effective permissions for one person: what their role grants, plus their
   * individual grants, minus their individual revokes.
   *
   * An explicit revoke beats a role grant. Without that, removing a single
   * capability from a single employee would mean inventing a bespoke role for
   * them — and a system that makes the careful action tedious gets the careless
   * one instead.
   *
   * OWNER is never overridable: an office must not be able to lock itself out
   * of its own administration.
   */
  async getEffectivePermissions(
    tenantId: string,
    userId: string,
    role: UserRole | string,
  ): Promise<ReadonlySet<string>> {
    if (role === UserRole.OWNER) {
      return new Set(ALL_PERMISSION_CODES);
    }

    const key = `user:${tenantId}:${userId}:${role}`;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const [fromRole, overrides] = await Promise.all([
      this.getRolePermissions(tenantId, role),
      this.prisma.unsafeUnscoped.userPermission.findMany({
        where: { tenantId, userId },
        select: { permissionCode: true, granted: true },
      }),
    ]);

    const effective = new Set(fromRole);
    for (const o of overrides) {
      if (o.granted) effective.add(o.permissionCode);
      else effective.delete(o.permissionCode);
    }

    this.cache.set(key, { permissions: effective, expiresAt: Date.now() + CACHE_TTL_MS });
    return effective;
  }

  /**
   * Drop cached grants. A role change affects everyone holding that role, so
   * their per-user entries are cleared too.
   */
  invalidate(tenantId: string, role?: UserRole): void {
    for (const key of [...this.cache.keys()]) {
      if (!key.includes(`:${tenantId}:`)) continue;
      if (!role || key.endsWith(`:${role}`)) this.cache.delete(key);
    }
  }

  invalidateUser(tenantId: string, userId: string): void {
    for (const key of [...this.cache.keys()]) {
      if (key.startsWith(`user:${tenantId}:${userId}:`)) this.cache.delete(key);
    }
  }

  /** The catalogue, for rendering the admin permission matrix. */
  getCatalog() {
    return PERMISSION_CATALOG;
  }
}
