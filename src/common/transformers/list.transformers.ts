import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { sanitizeText } from './text.transformers';

/** Optional ordered list of sanitized text lines (responsibilities, achievements...). */
export function TextList(maxItems = 30, maxLength = 500): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ type: [String], maxItems }),
    IsOptional(),
    Transform(({ value }: { value: unknown }) =>
      Array.isArray(value) ? value.map((item) => sanitizeText(item)) : value,
    ),
    IsArray(),
    ArrayMaxSize(maxItems),
    IsString({ each: true }),
    IsNotEmpty({ each: true }),
    MaxLength(maxLength, { each: true }),
  );
}

/** Optional list of unique UUIDs (relation ids). */
export function IdList(maxItems = 50): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ type: [String], format: 'uuid', maxItems }),
    IsOptional(),
    IsArray(),
    ArrayMaxSize(maxItems),
    ArrayUnique(),
    IsUUID('all', { each: true }),
  );
}
