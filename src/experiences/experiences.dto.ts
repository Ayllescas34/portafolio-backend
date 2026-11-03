import { PartialType } from '@nestjs/swagger';
import { DatePrecision, EmploymentType, WorkMode } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IdList, TextList } from '../common/transformers/list.transformers';
import { NullableText, SanitizedText } from '../common/transformers/text.transformers';
import { OptionalDateString, RequiredDateString } from '../common/utils/dates';

export class CreateExperienceDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  company!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  position!: string;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(160)
  location?: string | null;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType | null;

  @IsOptional()
  @IsEnum(WorkMode)
  workMode?: WorkMode | null;

  @RequiredDateString()
  startDate!: string;

  /** Required unless isCurrent is true; must be empty when it is. */
  @OptionalDateString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsEnum(DatePrecision)
  datePrecision?: DatePrecision;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1000)
  summary?: string | null;

  @TextList()
  responsibilities?: string[];

  @TextList()
  achievements?: string[];

  @IdList()
  technologyIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}
