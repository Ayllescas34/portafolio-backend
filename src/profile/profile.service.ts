import { Injectable } from '@nestjs/common';
import { Prisma, Profile, ProfileHighlight, SiteSettings } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { nextOrder } from '../common/utils/dates';
import { applyOrder, ensureFound } from '../common/utils/ordering';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHighlightDto, UpdateHighlightDto, UpdateProfileDto, UpdateSiteSettingsDto } from './profile.dto';

/** Profile and SiteSettings are singletons stored with id = 1. */
const SINGLETON_ID = 1;
const HIGHLIGHT_SORTABLE = ['displayOrder', 'kind', 'title', 'createdAt'] as const;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(): Promise<Profile> {
    return ensureFound(await this.prisma.profile.findUnique({ where: { id: SINGLETON_ID } }), 'Perfil');
  }

  updateProfile(dto: UpdateProfileDto): Promise<Profile> {
    return this.prisma.profile.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...dto },
      update: dto,
    });
  }

  async getSettings(): Promise<SiteSettings> {
    return ensureFound(await this.prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } }), 'Configuración');
  }

  updateSettings(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    return this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...dto },
      update: dto,
    });
  }

  async listHighlights(query: ListQueryDto): Promise<PaginatedResult<ProfileHighlight>> {
    const where: Prisma.ProfileHighlightWhereInput = {
      ...(query.isPublished !== undefined && { isPublished: query.isPublished }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.profileHighlight.findMany({
        where,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, HIGHLIGHT_SORTABLE, [
          { kind: 'asc' },
          { displayOrder: 'asc' },
        ]),
        ...pageArgs(query),
      }),
      this.prisma.profileHighlight.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async getHighlight(id: string): Promise<ProfileHighlight> {
    return ensureFound(await this.prisma.profileHighlight.findUnique({ where: { id } }), 'Destacado');
  }

  async createHighlight(dto: CreateHighlightDto): Promise<ProfileHighlight> {
    const { _max } = await this.prisma.profileHighlight.aggregate({
      where: { kind: dto.kind },
      _max: { displayOrder: true },
    });
    return this.prisma.profileHighlight.create({
      data: { ...dto, displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder) },
    });
  }

  async updateHighlight(id: string, dto: UpdateHighlightDto): Promise<ProfileHighlight> {
    await this.getHighlight(id);
    return this.prisma.profileHighlight.update({ where: { id }, data: dto });
  }

  async removeHighlight(id: string): Promise<void> {
    await this.getHighlight(id);
    await this.prisma.profileHighlight.delete({ where: { id } });
  }

  reorderHighlights(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.profileHighlight.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.profileHighlight.update({ where: { id }, data: { displayOrder } }),
    );
  }
}
