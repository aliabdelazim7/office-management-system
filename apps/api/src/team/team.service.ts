import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { ALL_PERMISSION_CODES } from '../rbac/permission.catalog';
import type { TenantContext } from '../tenancy/tenant-context';
import type {
  AcceptInvitationDto,
  InviteUserDto,
  SetMemberPermissionsDto,
  UpdateMemberDto,
} from './dto/team.dto';

const BCRYPT_ROUNDS = 12;
const INVITATION_TTL_DAYS = 7;

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  // ---------------------------------------------------------------------------
  //  Members
  // ---------------------------------------------------------------------------

  async listMembers(ctx: TenantContext) {
    const canSeeSalary = ctx.permissions.has('user.salary.view');

    const users = await this.prisma.scoped.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        jobTitle: true,
        department: true,
        phone: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        // Salaries are not returned unless the caller may see them. Filtering
        // in the client would still have shipped them over the wire.
        salary: canSeeSalary,
        hireDate: canSeeSalary,
        _count: { select: { permissionOverrides: true } },
      },
    });

    return users.map(({ _count, ...u }) => ({ ...u, overrideCount: _count.permissionOverrides }));
  }

  /** One member with their effective permissions and where each one came from. */
  async getMember(ctx: TenantContext, userId: string) {
    const user = await this.prisma.scoped.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        jobTitle: true,
        department: true,
        phone: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('الموظف غير موجود');

    const [fromRole, overrides, effective] = await Promise.all([
      this.rbac.getRolePermissions(ctx.tenantId, user.role),
      this.prisma.scoped.userPermission.findMany({
        where: { userId },
        select: { permissionCode: true, granted: true, note: true, createdAt: true },
      }),
      this.rbac.getEffectivePermissions(ctx.tenantId, user.id, user.role),
    ]);

    return {
      ...user,
      rolePermissions: [...fromRole],
      overrides,
      effectivePermissions: [...effective],
      // OWNER always holds everything, so the UI should not offer to edit it.
      permissionsLocked: user.role === UserRole.OWNER,
    };
  }

  async updateMember(ctx: TenantContext, userId: string, dto: UpdateMemberDto) {
    const target = await this.prisma.scoped.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true, status: true },
    });
    if (!target) throw new NotFoundException('الموظف غير موجود');

    this.assertNotSelfDemotion(ctx, target.id, dto.role, dto.status);
    await this.assertNotLastOwner(ctx, target, dto.role, dto.status);

    const updated = await this.prisma.scoped.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, name: true, email: true, role: true, status: true, jobTitle: true },
    });

    this.rbac.invalidateUser(ctx.tenantId, userId);
    await this.audit(ctx, AuditAction.UPDATE, 'User', userId, `تعديل بيانات ${updated.name}`);
    return updated;
  }

  async deactivateMember(ctx: TenantContext, userId: string) {
    const target = await this.prisma.scoped.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, name: true, role: true, status: true },
    });
    if (!target) throw new NotFoundException('الموظف غير موجود');

    if (target.id === ctx.userId) {
      throw new BadRequestException('لا يمكنك إيقاف حسابك');
    }
    await this.assertNotLastOwner(ctx, target, undefined, UserStatus.SUSPENDED);

    await this.prisma.scoped.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    // Suspension has to end the session now, not whenever the token expires.
    await this.prisma.client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.rbac.invalidateUser(ctx.tenantId, userId);
    await this.audit(ctx, AuditAction.UPDATE, 'User', userId, `إيقاف حساب ${target.name}`);
    return { id: userId, status: UserStatus.SUSPENDED };
  }

  // ---------------------------------------------------------------------------
  //  Per-user permission overrides
  // ---------------------------------------------------------------------------

  async setMemberPermissions(ctx: TenantContext, userId: string, dto: SetMemberPermissionsDto) {
    const target = await this.prisma.scoped.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, name: true, role: true },
    });
    if (!target) throw new NotFoundException('الموظف غير موجود');

    if (target.role === UserRole.OWNER) {
      throw new ForbiddenException('صلاحيات المالك غير قابلة للتعديل');
    }

    const known = new Set(ALL_PERMISSION_CODES);
    const unknown = dto.overrides.filter((o) => !known.has(o.code)).map((o) => o.code);
    if (unknown.length) {
      throw new BadRequestException(`صلاحيات غير معروفة: ${unknown.join('، ')}`);
    }

    // Nobody may hand out a permission they do not themselves hold. Otherwise
    // any account that can manage the team can escalate itself by proxy.
    const escalation = dto.overrides
      .filter((o) => o.granted && !ctx.permissions.has(o.code))
      .map((o) => o.code);
    if (escalation.length) {
      throw new ForbiddenException(
        `لا يمكنك منح صلاحيات لا تملكها: ${escalation.join('، ')}`,
      );
    }

    const fromRole = await this.rbac.getRolePermissions(ctx.tenantId, target.role);

    // Only store overrides that actually differ from the role. Persisting a
    // "grant" for something the role already gives would silently survive a
    // later narrowing of that role.
    const meaningful = dto.overrides.filter((o) => o.granted !== fromRole.has(o.code));

    await this.prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({ where: { tenantId: ctx.tenantId, userId } });
      if (meaningful.length) {
        await tx.userPermission.createMany({
          data: meaningful.map((o) => ({
            tenantId: ctx.tenantId,
            userId,
            permissionCode: o.code,
            granted: o.granted,
            grantedById: ctx.userId,
            note: dto.note,
          })),
        });
      }
    });

    this.rbac.invalidateUser(ctx.tenantId, userId);

    const effective = await this.rbac.getEffectivePermissions(ctx.tenantId, userId, target.role);

    await this.audit(
      ctx,
      AuditAction.PERMISSION_CHANGE,
      'User',
      userId,
      `تعديل صلاحيات ${target.name}: ${meaningful.filter((o) => o.granted).length} منح، ${meaningful.filter((o) => !o.granted).length} سحب`,
    );

    return {
      userId,
      overrides: meaningful,
      effectivePermissions: [...effective],
    };
  }

  // ---------------------------------------------------------------------------
  //  Invitations
  // ---------------------------------------------------------------------------

  async invite(ctx: TenantContext, dto: InviteUserDto) {
    if (dto.role === UserRole.OWNER) {
      throw new ForbiddenException('لا يمكن دعوة مالك آخر. انقل الملكية بدلاً من ذلك');
    }

    const existing = await this.prisma.scoped.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new ConflictException('هذا البريد مسجل بالفعل في المكتب');

    const grants = dto.grantPermissions ?? [];
    const escalation = grants.filter((c) => !ctx.permissions.has(c));
    if (escalation.length) {
      throw new ForbiddenException(`لا يمكنك منح صلاحيات لا تملكها: ${escalation.join('، ')}`);
    }

    const known = new Set(ALL_PERMISSION_CODES);
    const unknown = [...grants, ...(dto.revokePermissions ?? [])].filter((c) => !known.has(c));
    if (unknown.length) {
      throw new BadRequestException(`صلاحيات غير معروفة: ${unknown.join('، ')}`);
    }

    // The raw token is returned once and never stored; only its hash is kept,
    // so a database dump does not yield usable invitation links.
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const fromRole = await this.rbac.getRolePermissions(ctx.tenantId, dto.role);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: ctx.tenantId,
          name: dto.name,
          email: dto.email,
          role: dto.role,
          jobTitle: dto.jobTitle,
          status: UserStatus.PENDING_INVITATION,
          // No passwordHash: login guards against null so a pending invite
          // cannot be used to sign in.
          passwordHash: null,
        },
      });

      const overrides = [
        ...grants.filter((c) => !fromRole.has(c)).map((c) => ({ code: c, granted: true })),
        ...(dto.revokePermissions ?? [])
          .filter((c) => fromRole.has(c))
          .map((c) => ({ code: c, granted: false })),
      ];

      if (overrides.length) {
        await tx.userPermission.createMany({
          data: overrides.map((o) => ({
            tenantId: ctx.tenantId,
            userId: user.id,
            permissionCode: o.code,
            granted: o.granted,
            grantedById: ctx.userId,
          })),
        });
      }

      await tx.invitation.create({
        data: {
          tenantId: ctx.tenantId,
          email: dto.email,
          role: dto.role,
          tokenHash,
          invitedById: ctx.userId,
          expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
        },
      });

      return { user };
    });

    await this.audit(ctx, AuditAction.CREATE, 'Invitation', user.id, `دعوة ${dto.email} بدور ${dto.role}`);

    this.logger.log(`Invitation issued for ${dto.email} (${dto.role}) in tenant ${ctx.tenantId}`);

    return {
      userId: user.id,
      email: dto.email,
      role: dto.role,
      expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 86_400_000),
      // Email delivery arrives in Phase 8. Until then the owner copies this
      // link manually — which is honest, rather than pretending a mail was sent.
      invitationToken: token,
    };
  }

  async listInvitations(ctx: TenantContext) {
    return this.prisma.scoped.invitation.findMany({
      where: { acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        invitedBy: { select: { name: true } },
      },
    });
  }

  async revokeInvitation(ctx: TenantContext, id: string) {
    const invitation = await this.prisma.scoped.invitation.findFirst({
      where: { id, acceptedAt: null, revokedAt: null },
      select: { id: true, email: true },
    });
    if (!invitation) throw new NotFoundException('الدعوة غير موجودة أو مستخدمة');

    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.update({ where: { id }, data: { revokedAt: new Date() } });
      // Remove the placeholder account too, so the address can be re-invited.
      await tx.user.deleteMany({
        where: {
          tenantId: ctx.tenantId,
          email: invitation.email,
          status: UserStatus.PENDING_INVITATION,
        },
      });
    });

    await this.audit(ctx, AuditAction.DELETE, 'Invitation', id, `إلغاء دعوة ${invitation.email}`);
    return { id, revoked: true };
  }

  /** Public: shows who the invitation is for, without exposing anything else. */
  async describeInvitation(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const invitation = await this.prisma.client.invitation.findUnique({
      where: { tokenHash },
      select: {
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        tenant: { select: { name: true, slug: true } },
      },
    });

    if (!invitation || invitation.revokedAt) throw new NotFoundException('الدعوة غير صالحة');
    if (invitation.acceptedAt) throw new BadRequestException('تم استخدام هذه الدعوة');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('انتهت صلاحية الدعوة');

    return {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      tenant: invitation.tenant,
    };
  }

  /** Public: sets the password and activates the account. */
  async acceptInvitation(dto: AcceptInvitationDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');

    const invitation = await this.prisma.client.invitation.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tenantId: true,
        email: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });

    if (!invitation || invitation.revokedAt) throw new NotFoundException('الدعوة غير صالحة');
    if (invitation.acceptedAt) throw new BadRequestException('تم استخدام هذه الدعوة');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('انتهت صلاحية الدعوة');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.client.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: {
          tenantId_email: { tenantId: invitation.tenantId, email: invitation.email },
        },
        data: { passwordHash, status: UserStatus.ACTIVE },
        select: { id: true, name: true, email: true, role: true, tenantId: true },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    await this.prisma.client.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: AuditAction.CREATE,
        entityType: 'User',
        entityId: user.id,
        summary: `قبول الدعوة وتفعيل الحساب: ${user.email}`,
      },
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  // ---------------------------------------------------------------------------

  /** Stops an admin from removing their own access by accident. */
  private assertNotSelfDemotion(
    ctx: TenantContext,
    targetId: string,
    role?: UserRole,
    status?: UserStatus,
  ): void {
    if (targetId !== ctx.userId) return;
    if (role && role !== ctx.role) {
      throw new BadRequestException('لا يمكنك تغيير دورك بنفسك');
    }
    if (status && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('لا يمكنك إيقاف حسابك');
    }
  }

  /** An office with no active owner cannot be administered by anyone. */
  private async assertNotLastOwner(
    ctx: TenantContext,
    target: { id: string; role: UserRole; status: UserStatus },
    nextRole?: UserRole,
    nextStatus?: UserStatus,
  ): Promise<void> {
    if (target.role !== UserRole.OWNER) return;

    const losingOwner = (nextRole && nextRole !== UserRole.OWNER) || (nextStatus && nextStatus !== UserStatus.ACTIVE);
    if (!losingOwner) return;

    const activeOwners = await this.prisma.scoped.user.count({
      where: { role: UserRole.OWNER, status: UserStatus.ACTIVE, deletedAt: null },
    });

    if (activeOwners <= 1) {
      throw new BadRequestException('لا يمكن إزالة المالك الوحيد للمكتب');
    }
  }

  private async audit(
    ctx: TenantContext,
    action: AuditAction,
    entityType: string,
    entityId: string,
    summary: string,
  ): Promise<void> {
    try {
      await this.prisma.client.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          action,
          entityType,
          entityId,
          summary,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
      });
    } catch (error) {
      // Auditing must never break the request it is auditing.
      this.logger.error(`Failed to write audit log (${action} ${entityType})`, error as Error);
    }
  }
}
