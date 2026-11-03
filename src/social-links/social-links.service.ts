import { Injectable } from '@nestjs/common';
import { Prisma, SocialLink } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { nextOrder } from '../common/utils/dates';
import { applyOrder, ensureFound } from '../common/utils/ordering';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialLinkDto, UpdateSocialLinkDto } from './social-links.dto';

const SORTABLE = ['displayOrder', 'platform', 'label', 'createdAt'] as const;

@Injectable()
export class SocialLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQueryDto): Promise<PaginatedResult<SocialLink>> {
    const where: Prisma.SocialLinkWhereInput = {
      ...(query.isPublished !== undefined && { isPublished: query.isPublished }),
      ...(query.search && {
        OR: [
          { label: { contains: query.search, mode: 'insensitive' } },
          { url: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.socialLink.findMany({
        where,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, [{ displayOrder: 'asc' }]),
        ...pageArgs(query),
      }),
      this.prisma.socialLink.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async get(id: string): Promise<SocialLink> {
    return ensureFound(await this.prisma.socialLink.findUnique({ where: { id } }), 'Enlace');
  }

  async create(dto: CreateSocialLinkDto): Promise<SocialLink> {
    const { _max } = await this.prisma.socialLink.aggregate({ _max: { displayOrder: true } });
    return this.prisma.socialLink.create({
      data: { ...dto, displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder) },
    });
  }

  async update(id: string, dto: UpdateSocialLinkDto): Promise<SocialLink> {
    await this.get(id);
    return this.prisma.socialLink.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.socialLink.delete({ where: { id } });
  }

  reorder(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.socialLink.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.socialLink.update({ where: { id }, data: { displayOrder } }),
    );
  }
}
