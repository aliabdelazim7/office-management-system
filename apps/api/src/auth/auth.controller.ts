import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import type { Request } from 'express';
import type { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { AuthenticatedOnly, CurrentUser, Public } from '../common/decorators';
import type { TenantContext } from '../tenancy/tenant-context';

class RefreshDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private meta(req: Request) {
    return { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'تسجيل الدخول' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, this.meta(req));
  }

  @Public()
  @Post('register-tenant')
  @Throttle({ auth: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'إنشاء مكتب جديد — نقطة التسجيل الذاتي الوحيدة' })
  registerTenant(@Body() dto: RegisterTenantDto, @Req() req: Request) {
    return this.auth.registerTenant(dto, this.meta(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'تدوير رمز الجلسة' })
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, this.meta(req));
  }

  @AuthenticatedOnly()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'تسجيل الخروج' })
  async logout(
    @Body() dto: RefreshDto,
    @CurrentUser() user: TenantContext,
    @Req() req: Request,
  ): Promise<void> {
    await this.auth.logout(dto.refreshToken, user.tenantId, user.userId, this.meta(req));
  }

  @AuthenticatedOnly()
  @Get('me')
  @ApiOperation({ summary: 'بيانات المستخدم الحالي وصلاحياته' })
  me(@CurrentUser() user: TenantContext) {
    return this.auth.me(user.userId, user.tenantId, user.role as UserRole);
  }
}
