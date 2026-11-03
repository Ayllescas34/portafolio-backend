import { BadRequestException } from '@nestjs/common';
import { ListQueryDto, SortOrder } from '../dto/list-query.dto';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Marker type recognised by ResponseEnvelopeInterceptor ({ data, meta }). */
export class PaginatedResult<T> {
  constructor(
    readonly items: T[],
    readonly meta: PageMeta,
  ) {}

  static of<T>(items: T[], total: number, query: Pick<ListQueryDto, 'page' | 'pageSize'>) {
    return new PaginatedResult(items, {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    });
  }
}

export function pageArgs(query: Pick<ListQueryDto, 'page' | 'pageSize'>) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}

/**
 * Builds a Prisma orderBy from user input, accepting only whitelisted fields
 * so clients can never sort by (or probe) arbitrary columns.
 */
export function resolveOrderBy<Field extends string, Fallback>(
  sortBy: string | undefined,
  sortOrder: SortOrder,
  allowed: readonly Field[],
  fallback: Fallback[],
): (Fallback | Partial<Record<Field, SortOrder>>)[] {
  if (!sortBy) return fallback;
  if (!(allowed as readonly string[]).includes(sortBy)) {
    throw new BadRequestException({
      message: 'Campo de ordenamiento no permitido',
      details: [{ field: 'sortBy', errors: [`Valores permitidos: ${allowed.join(', ')}`] }],
    });
  }
  return [{ [sortBy]: sortOrder } as Partial<Record<Field, SortOrder>>];
}
