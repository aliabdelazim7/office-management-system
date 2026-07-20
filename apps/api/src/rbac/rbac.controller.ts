import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ArrayUnique, IsArray, IsEnum, IsString } from 'class-validator';
import { RbacService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedOnly, CurrentUser, RequirePermissions } from '../common/decorators';
import { ALL_PERMISSION_CODES } from './permission.catalog';
import type { TenantContext } from '../tenancy/tenant-context';

class UpdateMatrixDto {
  @IsEnum(UserRole)
  role!: UserRole;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}

@ApiTags('Permissions')
@Controller('permissions')
export class RbacController {
  constructor(
    private readonly rbac: RbacService,
    private readonly prisma: PrismaService,
  ) {}

  @AuthenticatedOnly()
  @Get('catalog')
  @ApiOperation({ summary: 'كتالوج الصلاحيات — الواجهة ترسم مصفوفة الصلاحيات منه' })
  catalog() {
    return this.rbac.getCatalog();
  }

  @RequirePermissions('permission.manage')
  @Get('matrix')
  @ApiOperation({ summary: 'مصفوفة الصلاحيات الحالية للمكتب' })
  async matrix(@CurrentUser() user: TenantContext) {
    const rows = await this.prisma.scoped.rolePermission.findMany({
      where: { granted: true },
      select: { role: true, permissionCode: true },
    });

    const byRole = Object.fromEntries(
      Object.values(UserRole).map((role) => [
        role,
        rows.filter((r) => r.role === role).map((r) => r.permissionCode),
      ]),
    );

    return { tenantId: user.tenantId, matrix: byRole };
  }

  @RequirePermissions('permission.manage')
  @Put('matrix')
  @ApiOperation({ summary: 'تعديل صلاحيات دور' })
  async updateMatrix(@Body() dto: UpdateMatrixDto, @CurrentUser() user: TenantContext) {
    // OWNER always holds every permission. Allowing it to be narrowed lets a
    // tenant lock itself out of its own administration with no way back in.
    if (dto.role === UserRole.OWNER) {
      return { role: UserRole.OWNER, permissionCodes: ALL_PERMISSION_CODES, locked: true };
    }

    const known = new Set(ALL_PERMISSION_CODES);
    const codes = dto.permissionCodes.filter((c) => known.has(c));

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { tenantId: user.tenantId, role: dto.role } });
      if (codes.length) {
        await tx.rolePermission.createMany({
          data: codes.map((permissionCode) => ({
            tenantId: user.tenantId,
            role: dto.role,
            permissionCode,
            granted: true,
          })),
        });
      }
    });

    this.rbac.invalidate(user.tenantId, dto.role);
    return { role: dto.role, permissionCodes: codes };
  }
}
