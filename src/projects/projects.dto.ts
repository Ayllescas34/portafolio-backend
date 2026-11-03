import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProjectCategory, ProjectKind, ProjectStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { IdList, TextList } from '../common/transformers/list.transformers';
import { NullableText, NullableUrl, QueryBoolean, SanitizedText } from '../common/transformers/text.transformers';
import { OptionalDateString } from '../common/utils/dates';
import { SLUG_PATTERN } from '../common/utils/slug';
import { IsHttpUrl, IsMediaUrl } from '../common/validators/url.validators';

export class ProjectImageDto {
  @IsMediaUrl()
  imageUrl!: string;

  /** Required: every image needs a text alternative. */
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  altText!: string;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(300)
  caption?: string | null;
}

export class CreateProjectDto {
  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  /** Generated from the title when omitted. */
  @IsOptional()
  @Matches(SLUG_PATTERN, { message: '$property solo admite minúsculas, números y guiones' })
  @MaxLength(160)
  slug?: string;

  @SanitizedText()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  shortDescription!: string;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(10000)
  fullDescription?: string | null;

  /** Professional, personal, academic or demo. */
  @IsOptional()
  @IsEnum(ProjectKind)
  kind?: ProjectKind;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1500)
  context?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1500)
  problem?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1500)
  solution?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1500)
  architecture?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1500)
  challenges?: string | null;

  /** Verifiable results only. */
  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(1500)
  outcome?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(160)
  role?: string | null;

  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @NullableUrl()
  @IsHttpUrl()
  repositoryUrl?: string | null;

  @IsOptional()
  @NullableUrl()
  @IsHttpUrl()
  liveUrl?: string | null;

  @IsOptional()
  @NullableUrl()
  @IsMediaUrl()
  coverImageUrl?: string | null;

  @IsOptional()
  @NullableText()
  @IsString()
  @MaxLength(200)
  coverImageAlt?: string | null;

  @OptionalDateString()
  startDate?: string | null;

  @OptionalDateString()
  endDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IdList()
  technologyIds?: string[];

  @TextList(20)
  responsibilities?: string[];

  @ApiPropertyOptional({ type: [ProjectImageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ProjectImageDto)
  images?: ProjectImageDto[];
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectKind)
  kind?: ProjectKind;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  isFeatured?: boolean;
}
