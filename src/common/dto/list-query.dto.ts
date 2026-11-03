import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { QueryBoolean, SanitizedText } from '../transformers/text.transformers';

export type SortOrder = 'asc' | 'desc';

/** Shared query string for admin listings: pagination, search and sorting. */
export class ListQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @SanitizedText()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Campo permitido por cada recurso' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: SortOrder = 'asc';

  @ApiPropertyOptional()
  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  isPublished?: boolean;
}
