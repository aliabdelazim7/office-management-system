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
   * Idempotent, so it is safe to run on every boot — this is deliberately not
   * a migration, because a migration that mutates data drifts from a fresh
   * `migrate deploy` and cannot be re-run.
   */
  async syncCatalog(): Promise<void> {
    await this.prisma.$transaction(
      PERMISSION_CATALOG.map((p, index) =>
        this.prisma.permission.upsert({
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
    // role_permissions so no tenant keeps a grant on a dead code.
    const removed = await this.prisma.permission.deleteMany({
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
    tx: Prisma.TransactionClient | PrismaClient = this.prisma,
  ): Promise<void> {
    const rows = (Object.entries(DEFAULT_ROLE_PERMISSIONS) as [UserRole, string[]][]).flatMap(
      ([role, codes]) => codes.map((permissionCode) => ({ tenantId, role, permissionCode, granted: true })),
    );

    await tx.rolePermission.createMany({ data: rows, skipDuplicates: true });
  }

  /** Effective permissions for a role within a tenant. */
  async getPermissionsFor(tenantId: string, role: UserRole | string): Promise<ReadonlySet<string>> {
    const key = `${tenantId}:${role}`;
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
      // The tenant has no matrix yet (legacy row, or provisioning was
      // interrupted). Fall back to the defaults for the role rather than
      // locking the user out entirely — but never widen beyond the default.
      this.logger.warn(`No permission matrix for tenant ${tenantId} role ${role}; using defaults.`);
      permissions = new Set(DEFAULT_ROLE_PERMISSIONS[role as UserRole] ?? []);
    } else {
      permissions = new Set(rows.map((r) => r.permissionCode));
    }

    this.cache.set(key, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
    return permissions;
  }

  /** Drop cached grants — call after any matrix mutation. */
  invalidate(tenantId: string, role?: UserRole): void {
    if (role) {
      this.cache.delete(`${tenantId}:${role}`);
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) this.cache.delete(key);
    }
  }

  /** The grouped catalogue, for rendering the admin permission matrix. */
  getCatalog() {
    return PERMISSION_CATALOG;
  }
}
