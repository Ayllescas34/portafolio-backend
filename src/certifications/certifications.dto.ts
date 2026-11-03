import { PartialType } from '@nestjs/swagger';
import { DatePrecision } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { NullableText, NullableUrl, SanitizedText } from '../common/transformers/text.transformers';
import { OptionalDateString } from '../common/utils/dates';
import { IsHttpUrl } from '../common/validators/url.validators';

export class CreateCertificationDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  issuer!: string;

  @OptionalDateString()
  issueDate?: string | null;

  @OptionalDateString()
  expirationDate?: string | null;

  @IsOptional()
  @IsEnum(DatePrecision)
  datePrecision?: DatePrecision;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(120)
  credentialId?: string | null;

  @IsOptional()
  @NullableUrl()
  @IsHttpUrl()
  credentialUrl?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(600)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateCertificationDto extends PartialType(CreateCertificationDto) {}
