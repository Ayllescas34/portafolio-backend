import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { NullableText, SanitizedText } from '../common/transformers/text.transformers';
import { SLUG_PATTERN } from '../common/utils/slug';

export class CreateTechnologyDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  /** Generated from the name when omitted. */
  @IsOptional()
  @Matches(SLUG_PATTERN, { message: '$property solo admite minúsculas, números y guiones' })
  @MaxLength(60)
  slug?: string;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(60)
  icon?: string | null;
}

export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto) {}
