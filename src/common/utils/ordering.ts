import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Validates that every id exists, then writes displayOrder = array index for
 * all of them in a single transaction (all or nothing).
 */
export async function applyOrder(
  prisma: PrismaClient,
  ids: string[],
  countExisting: (ids: string[]) => Promise<number>,
  update: (id: string, displayOrder: number) => Prisma.PrismaPromise<unknown>,
): Promise<void> {
  const found = await countExisting(ids);
  if (found !== ids.length) {
    throw new BadRequestException('La lista contiene registros inexistentes');
  }
  await prisma.$transaction(ids.map((id, index) => update(id, index)));
}

/** Throws a 404 with a readable message when a lookup returns null. */
export function ensureFound<T>(value: T | null | undefined, resource: string): T {
  if (value === null || value === undefined) {
    throw new NotFoundException(`${resource} no encontrado`);
  }
  return value;
}

/** "2025-02-01" -> Date at UTC midnight; null/undefined pass through. */
export function toDate(value: string | null | undefined): Date | null | undefined {
  if (value === null || value === undefined) return value;
  return new Date(`${value}T00:00:00.000Z`);
}
