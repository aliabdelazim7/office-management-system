import { ClientStatus, LegalType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

const EGYPT_MOBILE = /^01[0-25]\d{8}$/;

export class CreateClientDto {
  @ApiProperty({ example: 'المهندس طارق منصور' })
  @IsString()
  @MinLength(3, { message: 'اسم العميل 3 أحرف على الأقل' })
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'شركة المصرية للحلول البرمجية' })
  @IsString()
  @MinLength(3, { message: 'اسم الشركة 3 أحرف على الأقل' })
  @MaxLength(160)
  companyName!: string;

  @ApiPropertyOptional({ example: 'إيجيبت تيك' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  tradeName?: string;

  @ApiProperty({ enum: LegalType })
  @IsEnum(LegalType, { message: 'نوع الكيان القانوني غير صحيح' })
  legalType!: LegalType;

  @ApiProperty({ example: '01211112222' })
  @IsString()
  @Matches(EGYPT_MOBILE, { message: 'رقم هاتف مصري غير صحيح' })
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(EGYPT_MOBILE, { message: 'رقم واتساب مصري غير صحيح' })
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @Transform(({ value }) => (value ? String(value).toLowerCase().trim() : undefined))
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  governorate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessActivity?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branchesCount?: number;

  @ApiPropertyOptional({ description: 'الرقم القومي لصاحب المنشأة' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'الرقم القومي يتكون من 14 رقماً' })
  nationalId?: string;

  @ApiPropertyOptional({ description: 'الموظف المسؤول عن الحساب' })
  @IsOptional()
  @IsUUID()
  accountManagerId?: string;

  @ApiPropertyOptional({ enum: ClientStatus })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;
}

/** Every field optional; `clientCode` is never accepted from the client. */
export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class QueryClientsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ClientStatus })
  @IsOptional()
  @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiPropertyOptional({ enum: LegalType })
  @IsOptional()
  @IsEnum(LegalType)
  legalType?: LegalType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountManagerId?: string;
}
