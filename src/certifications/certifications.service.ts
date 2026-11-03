import { Injectable } from '@nestjs/common';
import { Certification, Prisma } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { assertDateRange, nextOrder, withDates } from '../common/utils/dates';
import { applyOrder, ensureFound } from '../common/utils/ordering';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificationDto, UpdateCertificationDto } from './certifications.dto';

const SORTABLE = ['displayOrder', 'issueDate', 'name', 'issuer', 'createdAt'] as const;
const DATE_FIELDS = ['issueDate', 'expirationDate'] as const;

@Injectable()
export class CertificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQueryDto): Promise<PaginatedResult<Certification>> {
    const where: Prisma.CertificationWhereInput = {
      ...(query.isPublished !== undefined && { isPublished: query.isPublished }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { issuer: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.certification.findMany({
        where,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, [{ displayOrder: 'asc' }]),
        ...pageArgs(query),
      }),
      this.prisma.certification.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async get(id: string): Promise<Certification> {
    return ensureFound(await this.prisma.certification.findUnique({ where: { id } }), 'Certificación');
  }

  async create(dto: CreateCertificationDto): Promise<Certification> {
    const data = withDates(dto, DATE_FIELDS);
    assertDateRange(data.issueDate, data.expirationDate, 'expirationDate');
    const { _max } = await this.prisma.certification.aggregate({ _max: { displayOrder: true } });
    return this.prisma.certification.create({
      data: { ...data, displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder) },
    });
  }

  async update(id: string, dto: UpdateCertificationDto): Promise<Certification> {
    const current = await this.get(id);
    const data = withDates(dto, DATE_FIELDS);
    assertDateRange(
      data.issueDate === undefined ? current.issueDate : data.issueDate,
      data.expirationDate === undefined ? current.expirationDate : data.expirationDate,
      'expirationDate',
    );
    return this.prisma.certification.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.certification.delete({ where: { id } });
  }

  reorder(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.certification.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.certification.update({ where: { id }, data: { displayOrder } }),
    );
  }
}
