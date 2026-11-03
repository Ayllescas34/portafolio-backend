import { PartialType } from '@nestjs/swagger';
import { DatePrecision, EducationStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { NullableText, SanitizedText } from '../common/transformers/text.transformers';
import { OptionalDateString } from '../common/utils/dates';

export class CreateEducationDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  institution!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  program!: string;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(120)
  degree?: string | null;

  @IsOptional()
  @IsEnum(EducationStatus)
  status?: EducationStatus;

  @OptionalDateString()
  startDate?: string | null;

  @OptionalDateString()
  endDate?: string | null;

  @IsOptional()
  @IsEnum(DatePrecision)
  datePrecision?: DatePrecision;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateEducationDto extends PartialType(CreateEducationDto) {}
