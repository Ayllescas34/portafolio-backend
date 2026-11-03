import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { NullableText, QueryBoolean, SanitizedText } from '../common/transformers/text.transformers';
import { SLUG_PATTERN } from '../common/utils/slug';

const SLUG_MESSAGE = { message: '$property solo admite minúsculas, números y guiones' };

export class CreateSkillCategoryDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @Matches(SLUG_PATTERN, SLUG_MESSAGE)
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateSkillCategoryDto extends PartialType(CreateSkillCategoryDto) {}

export class CreateSkillDto {
  @IsUUID()
  categoryId!: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @Matches(SLUG_PATTERN, SLUG_MESSAGE)
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  /** Qualitative label only, e.g. "Uso profesional". Percentages are not accepted. */
  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(40)
  @Matches(/^[^%]*$/, { message: '$property no admite porcentajes' })
  proficiencyLabel?: string | null;

  /** Only when confirmed. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(60)
  yearsOfExperience?: number | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(60)
  icon?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

export class SkillListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  isFeatured?: boolean;
}
