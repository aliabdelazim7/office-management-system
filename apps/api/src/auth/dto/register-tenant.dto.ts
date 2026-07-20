import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Slugs that would collide with infrastructure hostnames. */
const RESERVED_SLUGS = ['www', 'api', 'admin', 'app', 'portal', 'mail', 'static', 'cdn', 'auth'];

export class RegisterTenantDto {
  @ApiProperty({ example: 'مكتب النخبة للاستشارات' })
  @IsString()
  @MinLength(3, { message: 'اسم المكتب 3 أحرف على الأقل' })
  @MaxLength(120)
  tenantName!: string;

  @ApiProperty({ example: 'elite', description: 'المعرّف المستخدم في الرابط الفرعي' })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
    message: 'المعرّف يقبل حروفاً إنجليزية صغيرة وأرقاماً وشرطة، ولا يبدأ أو ينتهي بشرطة',
  })
  @Transform(({ value }) => {
    const slug = String(value ?? '').toLowerCase().trim();
    if (RESERVED_SLUGS.includes(slug)) {
      throw new Error(`المعرّف "${slug}" محجوز`);
    }
    return slug;
  })
  tenantSlug!: string;

  @ApiProperty({ example: 'أحمد محمود' })
  @IsString()
  @MinLength(3, { message: 'اسم المالك 3 أحرف على الأقل' })
  @MaxLength(120)
  ownerName!: string;

  @ApiProperty({ example: 'owner@elite.com' })
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'StrongPass!23' })
  @IsString()
  @MinLength(10, { message: 'كلمة مرور المالك 10 أحرف على الأقل' })
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'كلمة المرور يجب أن تحتوي حرفاً كبيراً وحرفاً صغيراً ورقماً',
  })
  password!: string;

  @ApiPropertyOptional({ example: '01012345678' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-25]\d{8}$/, { message: 'رقم هاتف مصري غير صحيح' })
  phone?: string;
}
