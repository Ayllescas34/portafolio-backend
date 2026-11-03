import { BadRequestException } from '@nestjs/common';
import { Prisma, Technology } from '@prisma/client';

/** Verifies that every referenced technology exists before linking it. */
export async function assertTechnologiesExist(tx: Prisma.TransactionClient, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const found = await tx.technology.count({ where: { id: { in: ids } } });
  if (found !== ids.length) {
    throw new BadRequestException({
      message: 'Alguna de las tecnologías seleccionadas no existe',
      details: [{ field: 'technologyIds', errors: ['contiene identificadores inexistentes'] }],
    });
  }
}

export type TechnologySummary = Pick<Technology, 'id' | 'name' | 'slug' | 'icon'>;

export const TECHNOLOGY_SUMMARY_SELECT = { id: true, name: true, slug: true, icon: true } as const;
