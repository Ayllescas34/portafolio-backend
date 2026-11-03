import { applyDecorators, BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, Matches } from 'class-validator';

/** Optional calendar date "YYYY-MM-DD"; null clears it on update. */
export function OptionalDateString(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ type: String, format: 'date', example: '2025-02-01', nullable: true }),
    IsOptional(),
    Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property debe tener el formato AAAA-MM-DD' }),
    IsISO8601({ strict: true }, { message: '$property no es una fecha válida' }),
  );
}

/** Required calendar date "YYYY-MM-DD". */
export function RequiredDateString(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ type: String, format: 'date', example: '2025-02-01' }),
    Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '$property debe tener el formato AAAA-MM-DD' }),
    IsISO8601({ strict: true }, { message: '$property no es una fecha válida' }),
  );
}

export function assertDateRange(
  start: Date | null | undefined,
  end: Date | null | undefined,
  endField = 'endDate',
): void {
  if (start && end && end < start) {
    throw new BadRequestException({
      message: 'La fecha final no puede ser anterior a la inicial',
      details: [{ field: endField, errors: ['debe ser posterior o igual a la fecha inicial'] }],
    });
  }
}

type WithDates<T, K extends keyof T> = Omit<T, K> & { [P in K]: Date | null | undefined };

/** Converts the given "YYYY-MM-DD" DTO fields to Date (UTC midnight). */
export function withDates<T extends object, K extends keyof T>(dto: T, keys: readonly K[]): WithDates<T, K> {
  const result: Record<string, unknown> = { ...(dto as Record<string, unknown>) };
  for (const key of keys) {
    const value = dto[key] as unknown as string | null | undefined;
    result[key as string] = value === null || value === undefined ? value : new Date(`${value}T00:00:00.000Z`);
  }
  return result as WithDates<T, K>;
}

/** Returns the next displayOrder (append at the end). */
export function nextOrder(max: number | null | undefined): number {
  return max === null || max === undefined ? 0 : max + 1;
}
