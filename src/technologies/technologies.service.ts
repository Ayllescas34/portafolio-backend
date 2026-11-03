import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Technology } from '@prisma/client';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { ensureFound } from '../common/utils/ordering';
import { uniqueSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechnologyDto, UpdateTechnologyDto } from './technologies.dto';

const SORTABLE = ['name', 'slug', 'createdAt'] as const;

export type TechnologyWithUsage = Technology & { _count: { projects: number; experiences: number } };

@Injectable()
export class TechnologiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQueryDto): Promise<PaginatedResult<TechnologyWithUsage>> {
    const where: Prisma.TechnologyWhereInput = query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.technology.findMany({
        where,
        include: { _count: { select: { projects: true, experiences: true } } },
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, [{ name: 'asc' }]),
        ...pageArgs(query),
      }),
      this.prisma.technology.count({ where }),
    ]);
    return PaginatedResult.of(items, total, query);
  }

  async get(id: string): Promise<Technology> {
    return ensureFound(await this.prisma.technology.findUnique({ where: { id } }), 'Tecnología');
  }

  async create(dto: CreateTechnologyDto): Promise<Technology> {
    const slug =
      dto.slug ??
      (await uniqueSlug(dto.name, async (s) => !!(await this.prisma.technology.findUnique({ where: { slug: s } }))));
    return this.prisma.technology.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateTechnologyDto): Promise<Technology> {
    await this.get(id);
    return this.prisma.technology.update({ where: { id }, data: dto });
  }

  /** Deleting a technology still linked to projects/experiences is refused. */
  async remove(id: string): Promise<void> {
    const technology = ensureFound(
      await this.prisma.technology.findUnique({
        where: { id },
        include: { _count: { select: { projects: true, experiences: true } } },
      }),
      'Tecnología',
    );
    const uses = technology._count.projects + technology._count.experiences;
    if (uses > 0) {
      throw new ConflictException(
        `La tecnología se usa en ${uses} registro(s). Quítala de esos proyectos o experiencias antes de eliminarla.`,
      );
    }
    await this.prisma.technology.delete({ where: { id } });
  }
}
