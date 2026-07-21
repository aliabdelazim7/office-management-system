import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, SequenceKind, TenantStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { TokenService, IssuedTokens } from './token.service';
import type { AppConfig } from '../config/configuration';
import type { LoginDto } from './dto/login.dto';
import type { RegisterTenantDto } from './dto/register-tenant.dto';

const BCRYPT_ROUNDS = 12;

/** Constant-time-ish dummy hash so a missing user costs the same as a wrong password. */
const DUMMY_HASH = '$2a$12$abcdefghijklmnopqrstuv0123456789ABCDEFGHIJKLMNOPQRSTUV';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResult extends IssuedTokens {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    tenant: { id: string; name: string; slug: string };
    permissions: string[];
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly rbac: RbacService,
    private readonly config: ConfigService,
  ) {}

  private get cfg(): AppConfig {
    return this.config.get<AppConfig>('app')!;
  }

  // -------------------------------------------------------------------------
  //  Login
  // -------------------------------------------------------------------------

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const db = this.prisma.unsafeUnscoped; // tenant is not known until the user is resolved
    const emailClean = dto.email.toLowerCase().trim();

    // Email is unique per tenant, not globally, so a bare email may be
    // ambiguous. Resolve by slug when given; otherwise require exactly one match.
    const candidates = await db.user.findMany({
      where: {
        email: emailClean,
        deletedAt: null,
        ...(dto.tenantSlug ? { tenant: { slug: dto.tenantSlug.toLowerCase().trim() } } : {}),
      },
      include: { tenant: { select: { id: true, name: true, slug: true, status: true, deletedAt: true } } },
    });

    if (candidates.length > 1) {
      throw new BadRequestException({
        message: 'هذا البريد مسجل في أكثر من مكتب. يرجى تحديد المكتب',
        code: 'TENANT_AMBIGUOUS',
        tenants: candidates.map((c) => ({ slug: c.tenant.slug, name: c.tenant.name })),
      });
    }

    const user = candidates[0];

    // Always run a bcrypt comparison, even when no user matched, so response
    // timing does not distinguish "unknown email" from "wrong password".
    const passwordValid = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);

    // A null passwordHash means an invited user who has not set one yet. They
    // must go through the invitation link; treating "no password on file" as
    // "any password works" would let anyone claim a pending invitation.
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new ForbiddenException(`الحساب مقفل مؤقتاً. حاول بعد ${minutes} دقيقة`);
    }

    if (!passwordValid) {
      await this.registerFailedAttempt(user.id, user.failedLoginAttempts, user.tenantId, meta);
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (user.status === UserStatus.PENDING_INVITATION) {
      throw new ForbiddenException('لم يتم تفعيل الحساب بعد. يرجى إكمال الدعوة');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('الحساب موقوف');
    }
    if (user.tenant.deletedAt || user.tenant.status === TenantStatus.SUSPENDED || user.tenant.status === TenantStatus.CANCELLED) {
      throw new ForbiddenException('حساب المكتب موقوف');
    }

    await db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const issued = await this.tokens.issue(
      { id: user.id, tenantId: user.tenantId, role: user.role },
      meta,
    );
    const permissions = await this.rbac.getEffectivePermissions(user.tenantId, user.id, user.role);

    await this.writeAudit(user.tenantId, user.id, AuditAction.LOGIN, 'User', user.id, 'تسجيل دخول ناجح', meta);

    return {
      ...issued,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug },
        permissions: [...permissions],
      },
    };
  }

  private async registerFailedAttempt(
    userId: string,
    current: number,
    tenantId: string,
    meta: RequestMeta,
  ): Promise<void> {
    const attempts = current + 1;
    const shouldLock = attempts >= (this.cfg?.auth?.maxFailedAttempts || 5);

    await this.prisma.unsafeUnscoped.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + (this.cfg?.auth?.lockoutMinutes || 15) * 60_000)
          : undefined,
      },
    });

    await this.writeAudit(
      tenantId,
      userId,
      AuditAction.LOGIN_FAILED,
      'User',
      userId,
      shouldLock ? `محاولة فاشلة ${attempts} — تم قفل الحساب` : `محاولة دخول فاشلة ${attempts}`,
      meta,
    );
  }

  // -------------------------------------------------------------------------
  //  Tenant registration
  // -------------------------------------------------------------------------

  async registerTenant(dto: RegisterTenantDto, meta: RequestMeta): Promise<AuthResult> {
    const db = this.prisma.unsafeUnscoped;
    const slug = dto.tenantSlug.toLowerCase().trim();
    const email = dto.email.toLowerCase().trim();

    if (await db.tenant.findUnique({ where: { slug }, select: { id: true } })) {
      throw new ConflictException('اسم المكتب (المعرّف) مستخدم بالفعل');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const { tenant, owner } = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug,
          status: TenantStatus.ACTIVE,
          email,
          phone: dto.phone,
          trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
        },
      });

      await this.rbac.provisionTenant(tenant.id, tx);

      await tx.numberSequence.createMany({
        data: [
          { tenantId: tenant.id, kind: SequenceKind.CLIENT_CODE, prefix: 'CL-' },
          { tenantId: tenant.id, kind: SequenceKind.INVOICE_NUMBER, prefix: 'INV-' },
          { tenantId: tenant.id, kind: SequenceKind.SERVICE_ORDER, prefix: 'SO-' },
          { tenantId: tenant.id, kind: SequenceKind.CONTRACT_NUMBER, prefix: 'CT-' },
          { tenantId: tenant.id, kind: SequenceKind.EXPENSE_VOUCHER, prefix: 'EXP-' },
        ],
      });

      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.ownerName,
          email,
          passwordHash,
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
          phone: dto.phone,
        },
      });

      return { tenant, owner };
    });

    this.logger.log(`Tenant provisioned: ${tenant.slug} (${tenant.id})`);

    const issued = await this.tokens.issue(
      { id: owner.id, tenantId: tenant.id, role: owner.role },
      meta,
    );
    const permissions = await this.rbac.getEffectivePermissions(tenant.id, owner.id, owner.role);

    await this.writeAudit(tenant.id, owner.id, AuditAction.CREATE, 'Tenant', tenant.id, `إنشاء مكتب: ${tenant.name}`, meta);

    return {
      ...issued,
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        avatarUrl: null,
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        permissions: [...permissions],
      },
    };
  }

  // -------------------------------------------------------------------------
  //  Session
  // -------------------------------------------------------------------------

  refresh(refreshToken: string, meta: RequestMeta): Promise<IssuedTokens> {
    return this.tokens.rotate(refreshToken, meta);
  }

  async logout(refreshToken: string, tenantId: string, userId: string, meta: RequestMeta): Promise<void> {
    await this.tokens.revoke(refreshToken);
    await this.writeAudit(tenantId, userId, AuditAction.LOGOUT, 'User', userId, 'تسجيل خروج', meta);
  }

  async me(userId: string, tenantId: string, role: UserRole) {
    const user = await this.prisma.unsafeUnscoped.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
        jobTitle: true,
        department: true,
        lastLoginAt: true,
        tenant: { select: { id: true, name: true, slug: true, logoUrl: true, settings: true } },
      },
    });

    if (!user) throw new UnauthorizedException('الحساب غير موجود');

    const permissions = await this.rbac.getEffectivePermissions(tenantId, userId, role);
    return { ...user, permissions: [...permissions] };
  }

  // -------------------------------------------------------------------------

  private async writeAudit(
    tenantId: string,
    userId: string | null,
    action: AuditAction,
    entityType: string,
    entityId: string,
    summary: string,
    meta: RequestMeta,
  ): Promise<void> {
    try {
      await this.prisma.unsafeUnscoped.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          entityType,
          entityId,
          summary,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log (${action} ${entityType})`, error as Error);
    }
  }
}
