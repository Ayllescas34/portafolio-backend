import { ProjectCategory, ProjectKind } from '@prisma/client';
import { IsEnum, IsOptional, Matches, MaxLength } from 'class-validator';
import { SLUG_PATTERN } from '../common/utils/slug';

export class PublicProjectQueryDto {
  /** Technology slug, e.g. "nestjs". */
  @IsOptional()
  @Matches(SLUG_PATTERN, { message: '$property tiene un formato inválido' })
  @MaxLength(60)
  technology?: string;

  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  /** PROFESSIONAL, PERSONAL, ACADEMIC or DEMO. */
  @IsOptional()
  @IsEnum(ProjectKind)
  kind?: ProjectKind;
}
