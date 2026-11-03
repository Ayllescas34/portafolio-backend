import { BadRequestException, Injectable } from '@nestjs/common';
import { ExperienceItemKind, Prisma } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { assertDateRange, nextOrder, withDates } from '../common/utils/dates';
import { applyOrder, ensureFound } from '../common/utils/ordering';
import { PrismaService } from '../prisma/prisma.service';
import { assertTechnologiesExist } from '../technologies/technology-links';
import { EXPERIENCE_INCLUDE, ExperienceView, toExperienceView } from './experience.mapper';
import { CreateExperienceDto, UpdateExperienceDto } from './experiences.dto';

const SORTABLE = ['displayOrder', 'startDate', 'endDate', 'company', 'position', 'createdAt'] as const;
const DATE_FIELDS = ['startDate', 'endDate'] as const;

function itemRows(kind: ExperienceItemKind, lines: string[] | undefined) {
  return (lines ?? []).map((content, displayOrder) => ({ kind, content, displayOrder }));
}

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQueryDto): Promise<PaginatedResult<ExperienceView>> {
    const where: Prisma.ExperienceWhereInput = {
      ...(query.isPublished !== undefined && { isPublished: query.isPublished }),
      ...(query.search && {
        OR: [
          { company: { contains: query.search, mode: 'insensitive' } },
          { position: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.experience.findMany({
        where,
        include: EXPERIENCE_INCLUDE,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, [{ displayOrder: 'asc' }]),
        ...pageArgs(query),
      }),
      this.prisma.experience.count({ where }),
    ]);
    return PaginatedResult.of(items.map(toExperienceView), total, query);
  }

  async get(id: string): Promise<ExperienceView> {
    const experience = await this.prisma.experience.findUnique({ where: { id }, include: EXPERIENCE_INCLUDE });
    return toExperienceView(ensureFound(experience, 'Experiencia'));
  }

  async create(dto: CreateExperienceDto): Promise<ExperienceView> {
    const { responsibilities, achievements, technologyIds = [], ...fields } = dto;
    const data = withDates(fields, DATE_FIELDS);
    this.assertPeriod(data.startDate, data.endDate, data.isCurrent ?? false);

    const id = await this.prisma.$transaction(async (tx) => {
      await assertTechnologiesExist(tx, technologyIds);
      const { _max } = await tx.experience.aggregate({ _max: { displayOrder: true } });
      const created = await tx.experience.create({
        data: {
          ...data,
          startDate: data.startDate as Date,
          displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder),
          items: {
            create: [
              ...itemRows(ExperienceItemKind.RESPONSIBILITY, responsibilities),
              ...itemRows(ExperienceItemKind.ACHIEVEMENT, achievements),
            ],
          },
          technologies: { create: technologyIds.map((technologyId) => ({ technologyId })) },
        },
      });
      return created.id;
    });
    return this.get(id);
  }

  async update(id: string, dto: UpdateExperienceDto): Promise<ExperienceView> {
    const current = ensureFound(await this.prisma.experience.findUnique({ where: { id } }), 'Experiencia');
    const { responsibilities, achievements, technologyIds, ...fields } = dto;
    const data = withDates(fields, DATE_FIELDS);
    const isCurrent = data.isCurrent ?? current.isCurrent;
    // Marking a job as current clears its end date unless one was sent explicitly.
    if (data.isCurrent === true && data.endDate === undefined) data.endDate = null;
    this.assertPeriod(
      data.startDate === undefined ? current.startDate : data.startDate,
      data.endDate === undefined ? current.endDate : data.endDate,
      isCurrent,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.experience.update({ where: { id }, data: { ...data, startDate: data.startDate ?? undefined } });
      for (const [kind, lines] of [
        [ExperienceItemKind.RESPONSIBILITY, responsibilities],
        [ExperienceItemKind.ACHIEVEMENT, achievements],
      ] as const) {
        if (lines === undefined) continue;
        await tx.experienceItem.deleteMany({ where: { experienceId: id, kind } });
        await tx.experienceItem.createMany({
          data: itemRows(kind, lines).map((row) => ({ ...row, experienceId: id })),
        });
      }
      if (technologyIds !== undefined) {
        await assertTechnologiesExist(tx, technologyIds);
        await tx.experienceTechnology.deleteMany({ where: { experienceId: id } });
        await tx.experienceTechnology.createMany({
          data: technologyIds.map((technologyId) => ({ experienceId: id, technologyId })),
        });
      }
    });
    return this.get(id);
  }

  /** Items and technology links belong to the experience and go with it. */
  async remove(id: string): Promise<void> {
    ensureFound(await this.prisma.experience.findUnique({ where: { id }, select: { id: true } }), 'Experiencia');
    await this.prisma.experience.delete({ where: { id } });
  }

  reorder(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.experience.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.experience.update({ where: { id }, data: { displayOrder } }),
    );
  }

  private assertPeriod(start: Date | null | undefined, end: Date | null | undefined, isCurrent: boolean): void {
    if (!start) {
      throw new BadRequestException({
        message: 'La fecha de inicio es obligatoria',
        details: [{ field: 'startDate', errors: ['es obligatorio'] }],
      });
    }
    if (isCurrent && end) {
      throw new BadRequestException({
        message: 'Una experiencia actual no puede tener fecha de finalización',
        details: [{ field: 'endDate', errors: ['debe estar vacío cuando el puesto es actual'] }],
      });
    }
    if (!isCurrent && !end) {
      throw new BadRequestException({
        message: 'Indica la fecha de finalización o marca el puesto como actual',
        details: [{ field: 'endDate', errors: ['es obligatorio si el puesto no es actual'] }],
      });
    }
    assertDateRange(start, end);
  }
}
