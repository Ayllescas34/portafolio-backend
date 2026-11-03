import { BadRequestException } from '@nestjs/common';
import { resolveOrderBy, PaginatedResult } from '../pagination/paginated-result';
import { sanitizeText } from '../transformers/text.transformers';
import { assertDateRange, withDates } from './dates';
import { slugify, uniqueSlug } from './slug';

describe('slugify', () => {
  it('removes accents, symbols and spaces', () => {
    expect(slugify('Diseño de APIs REST')).toBe('diseno-de-apis-rest');
    expect(slugify('  Node.js & C#  ')).toBe('node-js-c-sharp');
    expect(slugify('C++')).toBe('c-plus-plus');
  });
});

describe('uniqueSlug', () => {
  it('appends a numeric suffix until the slug is free', async () => {
    const taken = new Set(['angular', 'angular-2']);
    await expect(uniqueSlug('Angular', (s) => Promise.resolve(taken.has(s)))).resolves.toBe('angular-3');
  });
});

describe('sanitizeText', () => {
  it('trims, strips tags and control characters', () => {
    expect(sanitizeText('  <script>alert(1)</script>Hola\u0007 mundo  ')).toBe('alert(1)Hola mundo');
    expect(sanitizeText('línea 1\r\nlínea 2')).toBe('línea 1\nlínea 2');
  });

  it('keeps comparison symbols that are not tags', () => {
    expect(sanitizeText('a < b y c > d')).toBe('a < b y c > d');
  });

  it('ignores non-string values', () => {
    expect(sanitizeText(42)).toBe(42);
  });
});

describe('resolveOrderBy', () => {
  const allowed = ['displayOrder', 'title'] as const;

  it('uses the fallback when no field is requested', () => {
    expect(resolveOrderBy(undefined, 'asc', allowed, [{ displayOrder: 'asc' }])).toEqual([{ displayOrder: 'asc' }]);
  });

  it('accepts whitelisted fields', () => {
    expect(resolveOrderBy('title', 'desc', allowed, [])).toEqual([{ title: 'desc' }]);
  });

  it('rejects fields outside the whitelist', () => {
    expect(() => resolveOrderBy('passwordHash', 'asc', allowed, [])).toThrow(BadRequestException);
  });
});

describe('PaginatedResult', () => {
  it('computes total pages (minimum 1)', () => {
    expect(PaginatedResult.of([], 0, { page: 1, pageSize: 20 }).meta.totalPages).toBe(1);
    expect(PaginatedResult.of([1], 41, { page: 3, pageSize: 20 }).meta).toEqual({
      page: 3,
      pageSize: 20,
      total: 41,
      totalPages: 3,
    });
  });
});

describe('dates', () => {
  it('converts DTO dates to UTC midnight and keeps null / undefined', () => {
    const result = withDates({ a: '2025-02-01', b: null, c: undefined, other: 1 }, ['a', 'b', 'c'] as const);
    expect(result.a?.toISOString()).toBe('2025-02-01T00:00:00.000Z');
    expect(result.b).toBeNull();
    expect(result.c).toBeUndefined();
    expect(result.other).toBe(1);
  });

  it('rejects an end date before the start date', () => {
    expect(() => assertDateRange(new Date('2025-02-01'), new Date('2025-01-01'))).toThrow(BadRequestException);
    expect(() => assertDateRange(new Date('2025-02-01'), null)).not.toThrow();
  });
});
