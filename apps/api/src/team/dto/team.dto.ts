import { UserRole, UserStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'محمد أحمد' })
  @IsString()
  @MinLength(3, { message: 'الاسم 3 أحرف على الأقل' })
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole, { message: 'الدور الوظيفي غير صحيح' })
  role!: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional({
    description: 'صلاحيات إضافية فوق ما يمنحه الدور',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  grantPermissions?: string[];

  @ApiPropertyOptional({
    description: 'صلاحيات تُسحب رغم أن الدور يمنحها',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  revokePermissions?: string[];
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token!: string;

  @ApiProperty({ example: 'StrongPass!23' })
  @IsString()
  @MinLength(10, { message: 'كلمة المرور 10 أحرف على الأقل' })
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'كلمة المرور يجب أن تحتوي حرفاً كبيراً وحرفاً صغيراً ورقماً',
  })
  password!: string;
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^01[0-25]\d{8}$/, { message: 'رقم هاتف مصري غير صحيح' })
  phone?: string;
}

class PermissionOverrideDto {
  @IsString()
  code!: string;

  /** true = grant beyond the role, false = revoke despite the role. */
  @IsBoolean()
  granted!: boolean;
}

export class SetMemberPermissionsDto {
  @ApiProperty({
    description: 'الاستثناءات الفردية. أي صلاحية غير مذكورة تتبع الدور',
    type: [PermissionOverrideDto],
  })
  @IsArray()
  @ArrayMaxSize(400)
  @Type(() => PermissionOverrideDto)
  overrides!: PermissionOverrideDto[];

  @ApiPropertyOptional({ description: 'سبب التعديل — يُحفظ في سجل التدقيق' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
