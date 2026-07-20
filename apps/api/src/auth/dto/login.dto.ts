import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'owner@elite.com' })
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'StrongPass!23' })
  @IsString()
  @MinLength(8, { message: 'كلمة المرور 8 أحرف على الأقل' })
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    example: 'elite',
    description: 'معرّف المكتب — مطلوب فقط إذا كان البريد مسجلاً في أكثر من مكتب',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'معرّف المكتب يقبل حروفاً إنجليزية صغيرة وأرقاماً وشرطة فقط' })
  tenantSlug?: string;
}
