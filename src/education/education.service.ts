import { Injectable } from '@nestjs/common';
import { Education, Prisma } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { assertDateRange, nextOrder, withDates } from '../common/utils/dates';
import { applyOrder, ensureFound } from '../common/utils/ordering';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEducationDto, UpdateEducationDto } from './education.dto';

const SORTABLE = ['displayOrder', 'startDate', 'endDate', 'institution', 'program', 'createdAt'] as const;
const DATE_FIELDS = ['startDate', 'endDate'] as const;

@Injectable()
export class EducationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQueryDto): Promise<PaginatedResult<Education>> {
    const where: Prisma.EducationWhereInput = {
      ...(query.isPublished !== undefined && { isPublished: query.isPublished }),
      ...(query.search && {
        OR: [
          { institution: { contains: query.search, mode: 'insensitive' } },
          { program: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.education.findMany({
        where,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, [{ displayOrder: 'asc' }]),
        ...pageArgs(query),
      }),
      this.prisma.education.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async get(id: string): Promise<Education> {
    return ensureFound(await this.prisma.education.findUnique({ where: { id } }), 'Estudio');
  }

  async create(dto: CreateEducationDto): Promise<Education> {
    const data = withDates(dto, DATE_FIELDS);
    assertDateRange(data.startDate, data.endDate);
    const { _max } = await this.prisma.education.aggregate({ _max: { displayOrder: true } });
    return this.prisma.education.create({
      data: { ...data, displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder) },
    });
  }

  async update(id: string, dto: UpdateEducationDto): Promise<Education> {
    const current = await this.get(id);
    const data = withDates(dto, DATE_FIELDS);
    assertDateRange(
      data.startDate === undefined ? current.startDate : data.startDate,
      data.endDate === undefined ? current.endDate : data.endDate,
    );
    return this.prisma.education.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.education.delete({ where: { id } });
  }

  reorder(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.education.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.education.update({ where: { id }, data: { displayOrder } }),
    );
  }
}
