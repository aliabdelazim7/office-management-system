import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TeamService } from './team.service';
import {
  AcceptInvitationDto,
  InviteUserDto,
  SetMemberPermissionsDto,
  UpdateMemberDto,
} from './dto/team.dto';
import { AuthenticatedOnly, CurrentUser, Public, RequirePermissions } from '../common/decorators';
import type { TenantContext } from '../tenancy/tenant-context';

@ApiTags('Team')
@Controller()
export class TeamController {
  constructor(private readonly team: TeamService) {}

  // --- Members ---------------------------------------------------------------

  @RequirePermissions('user.view')
  @Get('team/members')
  @ApiOperation({ summary: 'قائمة فريق العمل' })
  listMembers(@CurrentUser() user: TenantContext) {
    return this.team.listMembers(user);
  }

  @RequirePermissions('user.view')
  @Get('team/members/:id')
  @ApiOperation({ summary: 'بيانات موظف وصلاحياته الفعلية' })
  getMember(@CurrentUser() user: TenantContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.team.getMember(user, id);
  }

  @RequirePermissions('user.update')
  @Patch('team/members/:id')
  @ApiOperation({ summary: 'تعديل بيانات موظف' })
  updateMember(
    @CurrentUser() user: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.team.updateMember(user, id, dto);
  }

  @RequirePermissions('user.deactivate')
  @Delete('team/members/:id')
  @ApiOperation({ summary: 'إيقاف حساب موظف وإنهاء جلساته' })
  deactivateMember(@CurrentUser() user: TenantContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.team.deactivateMember(user, id);
  }

  // --- Per-user permissions --------------------------------------------------

  @RequirePermissions('permission.manage')
  @Put('team/members/:id/permissions')
  @ApiOperation({ summary: 'ضبط الصلاحيات الفردية لموظف (منح أو سحب فوق دوره)' })
  setPermissions(
    @CurrentUser() user: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetMemberPermissionsDto,
  ) {
    return this.team.setMemberPermissions(user, id, dto);
  }

  // --- Invitations -----------------------------------------------------------

  @RequirePermissions('user.invite')
  @Post('team/invitations')
  @ApiOperation({ summary: 'دعوة موظف جديد بدور وصلاحيات محددة' })
  invite(@CurrentUser() user: TenantContext, @Body() dto: InviteUserDto) {
    return this.team.invite(user, dto);
  }

  @RequirePermissions('user.invite')
  @Get('team/invitations')
  @ApiOperation({ summary: 'الدعوات المعلقة' })
  listInvitations(@CurrentUser() user: TenantContext) {
    return this.team.listInvitations(user);
  }

  @RequirePermissions('user.invite')
  @Delete('team/invitations/:id')
  @ApiOperation({ summary: 'إلغاء دعوة' })
  revokeInvitation(@CurrentUser() user: TenantContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.team.revokeInvitation(user, id);
  }

  // --- Public invitation flow ------------------------------------------------

  @Public()
  @Get('invitations/:token')
  @Throttle({ auth: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'بيانات الدعوة قبل قبولها' })
  describe(@Param('token') token: string) {
    return this.team.describeInvitation(token);
  }

  @Public()
  @Post('invitations/accept')
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'قبول الدعوة وتعيين كلمة المرور' })
  accept(@Body() dto: AcceptInvitationDto) {
    return this.team.acceptInvitation(dto);
  }

  // --- Self ------------------------------------------------------------------

  @AuthenticatedOnly()
  @Get('me/permissions')
  @ApiOperation({ summary: 'صلاحياتي الفعلية — الواجهة ترسم نفسها منها' })
  myPermissions(@CurrentUser() user: TenantContext) {
    return { role: user.role, permissions: [...user.permissions] };
  }
}
