import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Skill, SkillCategory } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { nextOrder } from '../common/utils/dates';
import { applyOrder, ensureFound } from '../common/utils/ordering';
import { uniqueSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSkillCategoryDto,
  CreateSkillDto,
  SkillListQueryDto,
  UpdateSkillCategoryDto,
  UpdateSkillDto,
} from './skills.dto';

const CATEGORY_SORTABLE = ['displayOrder', 'name', 'createdAt'] as const;
const SKILL_SORTABLE = ['displayOrder', 'name', 'createdAt', 'isFeatured'] as const;

export type CategoryWithCount = SkillCategory & { _count: { skills: number } };
export type SkillWithCategory = Skill & { category: Pick<SkillCategory, 'id' | 'name' | 'slug'> };

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Categories ──────────────────────────────────────────────────────────

  async listCategories(query: ListQueryDto): Promise<PaginatedResult<CategoryWithCount>> {
    const where: Prisma.SkillCategoryWhereInput = query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.skillCategory.findMany({
        where,
        include: { _count: { select: { skills: true } } },
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, CATEGORY_SORTABLE, [{ displayOrder: 'asc' }]),
        ...pageArgs(query),
      }),
      this.prisma.skillCategory.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async getCategory(id: string): Promise<SkillCategory> {
    return ensureFound(await this.prisma.skillCategory.findUnique({ where: { id } }), 'Categoría');
  }

  async createCategory(dto: CreateSkillCategoryDto): Promise<SkillCategory> {
    const slug =
      dto.slug ??
      (await uniqueSlug(dto.name, async (s) => !!(await this.prisma.skillCategory.findUnique({ where: { slug: s } }))));
    const { _max } = await this.prisma.skillCategory.aggregate({ _max: { displayOrder: true } });
    return this.prisma.skillCategory.create({
      data: { ...dto, slug, displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder) },
    });
  }

  async updateCategory(id: string, dto: UpdateSkillCategoryDto): Promise<SkillCategory> {
    await this.getCategory(id);
    return this.prisma.skillCategory.update({ where: { id }, data: dto });
  }

  /** Categories with skills are protected (FK RESTRICT + explicit message). */
  async removeCategory(id: string): Promise<void> {
    const category = ensureFound(
      await this.prisma.skillCategory.findUnique({
        where: { id },
        include: { _count: { select: { skills: true } } },
      }),
      'Categoría',
    );
    if (category._count.skills > 0) {
      throw new ConflictException(
        `La categoría contiene ${category._count.skills} habilidad(es). Muévelas o elimínalas primero.`,
      );
    }
    await this.prisma.skillCategory.delete({ where: { id } });
  }

  reorderCategories(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.skillCategory.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.skillCategory.update({ where: { id }, data: { displayOrder } }),
    );
  }

  // ─── Skills ──────────────────────────────────────────────────────────────

  async listSkills(query: SkillListQueryDto): Promise<PaginatedResult<SkillWithCategory>> {
    const where: Prisma.SkillWhereInput = {
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.isPublished !== undefined && { isPublished: query.isPublished }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: resolveOrderBy<(typeof SKILL_SORTABLE)[number], Prisma.SkillOrderByWithRelationInput>(
          query.sortBy,
          query.sortOrder,
          SKILL_SORTABLE,
          [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
        ),
        ...pageArgs(query),
      }),
      this.prisma.skill.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async getSkill(id: string): Promise<Skill> {
    return ensureFound(await this.prisma.skill.findUnique({ where: { id } }), 'Habilidad');
  }

  async createSkill(dto: CreateSkillDto): Promise<Skill> {
    await this.getCategory(dto.categoryId);
    const slug =
      dto.slug ??
      (await uniqueSlug(dto.name, async (s) => !!(await this.prisma.skill.findUnique({ where: { slug: s } }))));
    const { _max } = await this.prisma.skill.aggregate({
      where: { categoryId: dto.categoryId },
      _max: { displayOrder: true },
    });
    return this.prisma.skill.create({
      data: { ...dto, slug, displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder) },
    });
  }

  async updateSkill(id: string, dto: UpdateSkillDto): Promise<Skill> {
    await this.getSkill(id);
    if (dto.categoryId) await this.getCategory(dto.categoryId);
    return this.prisma.skill.update({ where: { id }, data: dto });
  }

  async removeSkill(id: string): Promise<void> {
    await this.getSkill(id);
    await this.prisma.skill.delete({ where: { id } });
  }

  reorderSkills(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.skill.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.skill.update({ where: { id }, data: { displayOrder } }),
    );
  }
}
