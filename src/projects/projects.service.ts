import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageArgs, PaginatedResult, resolveOrderBy } from '../common/pagination/paginated-result';
import { assertDateRange, nextOrder, withDates } from '../common/utils/dates';
import { applyOrder, ensureFound } from '../common/utils/ordering';
import { uniqueSlug } from '../common/utils/slug';
import { PrismaService } from '../prisma/prisma.service';
import { assertTechnologiesExist } from '../technologies/technology-links';
import { PROJECT_INCLUDE, ProjectView, toProjectView } from './project.mapper';
import { CreateProjectDto, ProjectImageDto, ProjectListQueryDto, UpdateProjectDto } from './projects.dto';

const SORTABLE = ['displayOrder', 'title', 'status', 'startDate', 'createdAt', 'updatedAt'] as const;
const DATE_FIELDS = ['startDate', 'endDate'] as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProjectListQueryDto): Promise<PaginatedResult<ProjectView>> {
    const where: Prisma.ProjectWhereInput = {
      ...(query.isPublished !== undefined && { isPublished: query.isPublished }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.category && { category: query.category }),
      ...(query.kind && { kind: query.kind }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { shortDescription: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        orderBy: resolveOrderBy(query.sortBy, query.sortOrder, SORTABLE, [{ displayOrder: 'asc' }]),
        ...pageArgs(query),
      }),
      this.prisma.project.count({ where }),
    ]);
    return PaginatedResult.of(items.map(toProjectView), total, query);
  }

  async get(id: string): Promise<ProjectView> {
    const project = await this.prisma.project.findUnique({ where: { id }, include: PROJECT_INCLUDE });
    return toProjectView(ensureFound(project, 'Proyecto'));
  }

  async create(dto: CreateProjectDto): Promise<ProjectView> {
    const { technologyIds = [], responsibilities = [], images = [], ...fields } = dto;
    const data = withDates(fields, DATE_FIELDS);
    assertDateRange(data.startDate, data.endDate);
    this.assertCoverAlt(data.coverImageUrl, data.coverImageAlt);

    const id = await this.prisma.$transaction(async (tx) => {
      await assertTechnologiesExist(tx, technologyIds);
      const slug =
        data.slug ??
        (await uniqueSlug(data.title, async (s) => !!(await tx.project.findUnique({ where: { slug: s } }))));
      const { _max } = await tx.project.aggregate({ _max: { displayOrder: true } });
      const created = await tx.project.create({
        data: {
          ...data,
          slug,
          displayOrder: dto.displayOrder ?? nextOrder(_max.displayOrder),
          technologies: { create: technologyIds.map((technologyId) => ({ technologyId })) },
          responsibilities: { create: responsibilities.map((content, displayOrder) => ({ content, displayOrder })) },
          images: { create: imageRows(images) },
        },
      });
      return created.id;
    });
    return this.get(id);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectView> {
    const current = ensureFound(await this.prisma.project.findUnique({ where: { id } }), 'Proyecto');
    const { technologyIds, responsibilities, images, ...fields } = dto;
    const data = withDates(fields, DATE_FIELDS);
    assertDateRange(
      data.startDate === undefined ? current.startDate : data.startDate,
      data.endDate === undefined ? current.endDate : data.endDate,
    );
    this.assertCoverAlt(
      data.coverImageUrl === undefined ? current.coverImageUrl : data.coverImageUrl,
      data.coverImageAlt === undefined ? current.coverImageAlt : data.coverImageAlt,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({ where: { id }, data });
      if (technologyIds !== undefined) {
        await assertTechnologiesExist(tx, technologyIds);
        await tx.projectTechnology.deleteMany({ where: { projectId: id } });
        await tx.projectTechnology.createMany({
          data: technologyIds.map((technologyId) => ({ projectId: id, technologyId })),
        });
      }
      if (responsibilities !== undefined) {
        await tx.projectResponsibility.deleteMany({ where: { projectId: id } });
        await tx.projectResponsibility.createMany({
          data: responsibilities.map((content, displayOrder) => ({ projectId: id, content, displayOrder })),
        });
      }
      if (images !== undefined) {
        await tx.projectImage.deleteMany({ where: { projectId: id } });
        await tx.projectImage.createMany({ data: imageRows(images).map((row) => ({ ...row, projectId: id })) });
      }
    });
    return this.get(id);
  }

  /** Technology links, responsibilities and images are owned by the project. */
  async remove(id: string): Promise<void> {
    ensureFound(await this.prisma.project.findUnique({ where: { id }, select: { id: true } }), 'Proyecto');
    await this.prisma.project.delete({ where: { id } });
  }

  reorder(ids: string[]): Promise<void> {
    return applyOrder(
      this.prisma,
      ids,
      (list) => this.prisma.project.count({ where: { id: { in: list } } }),
      (id, displayOrder) => this.prisma.project.update({ where: { id }, data: { displayOrder } }),
    );
  }

  private assertCoverAlt(url: string | null | undefined, alt: string | null | undefined): void {
    if (url && !alt) {
      throw new BadRequestException({
        message: 'La imagen de portada necesita un texto alternativo',
        details: [{ field: 'coverImageAlt', errors: ['es obligatorio cuando hay imagen de portada'] }],
      });
    }
  }
}

function imageRows(images: ProjectImageDto[]) {
  return images.map(({ imageUrl, altText, caption }, displayOrder) => ({
    imageUrl,
    altText,
    caption: caption ?? null,
    displayOrder,
  }));
}
