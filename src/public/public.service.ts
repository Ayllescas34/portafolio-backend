import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectCategory, ProjectKind } from '@prisma/client';
import { EXPERIENCE_INCLUDE, toExperienceView } from '../experiences/experience.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { PROJECT_INCLUDE, ProjectView, toProjectView } from '../projects/project.mapper';
import { PublicProjectQueryDto } from './public.dto';

const PUBLISHED_ORDER = [{ displayOrder: 'asc' as const }];

/** Fields of a project that are safe and useful for public cards / detail. */
function publicProject(project: ProjectView) {
  const { isPublished: _p, displayOrder: _o, createdAt: _c, ...rest } = project;
  return rest;
}

export type PublicProject = ReturnType<typeof publicProject>;

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everything the home page needs, in one round trip. Only published content. */
  async portfolio() {
    const [settings, profile, highlights, socialLinks, experiences, education, categories, certifications, projects] =
      await this.prisma.$transaction([
        this.prisma.siteSettings.findUnique({
          where: { id: 1 },
          select: {
            siteTitle: true,
            siteDescription: true,
            ogImageUrl: true,
            defaultTheme: true,
            defaultLocale: true,
            contactFormEnabled: true,
          },
        }),
        this.prisma.profile.findUnique({ where: { id: 1 } }),
        this.prisma.profileHighlight.findMany({
          where: { isPublished: true },
          select: { id: true, kind: true, title: true, description: true },
          orderBy: [{ kind: 'asc' }, { displayOrder: 'asc' }],
        }),
        this.prisma.socialLink.findMany({
          where: { isPublished: true },
          select: { id: true, platform: true, label: true, url: true },
          orderBy: PUBLISHED_ORDER,
        }),
        this.prisma.experience.findMany({
          where: { isPublished: true },
          include: EXPERIENCE_INCLUDE,
          orderBy: PUBLISHED_ORDER,
        }),
        this.prisma.education.findMany({
          where: { isPublished: true },
          omit: { isPublished: true, createdAt: true, updatedAt: true },
          orderBy: PUBLISHED_ORDER,
        }),
        this.prisma.skillCategory.findMany({
          where: { skills: { some: { isPublished: true } } },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            skills: {
              where: { isPublished: true },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                proficiencyLabel: true,
                yearsOfExperience: true,
                icon: true,
                isFeatured: true,
              },
              orderBy: PUBLISHED_ORDER,
            },
          },
          orderBy: PUBLISHED_ORDER,
        }),
        this.prisma.certification.findMany({
          where: { isPublished: true },
          omit: { isPublished: true, createdAt: true, updatedAt: true },
          orderBy: PUBLISHED_ORDER,
        }),
        this.prisma.project.findMany({
          where: { isPublished: true },
          include: PROJECT_INCLUDE,
          orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
        }),
      ]);

    if (!profile || !settings) throw new NotFoundException('El portafolio aún no tiene contenido');

    const publicProjects = projects.map((p) => publicProject(toProjectView(p)));
    return {
      site: settings,
      profile: {
        fullName: profile.fullName,
        professionalTitle: profile.professionalTitle,
        shortBio: profile.shortBio,
        tagline: profile.tagline,
        longBio: profile.longBio,
        location: profile.location,
        publicEmail: profile.publicEmail,
        phone: profile.isPhonePublic ? profile.phone : null,
        availability: profile.availability,
        profileImageUrl: profile.profileImageUrl,
        profileImageAlt: profile.profileImageAlt,
        cvFileUrl: profile.cvFileUrl,
        updatedAt: profile.updatedAt,
      },
      highlights,
      socialLinks,
      experiences: experiences.map((e) => {
        const { isPublished: _p, createdAt: _c, updatedAt: _u, ...rest } = toExperienceView(e);
        return rest;
      }),
      education,
      skillCategories: categories.map((category) => ({
        ...category,
        skills: category.skills.map((skill) => ({
          ...skill,
          yearsOfExperience: skill.yearsOfExperience === null ? null : Number(skill.yearsOfExperience),
        })),
      })),
      certifications,
      projects: publicProjects,
      projectFilters: projectFilters(publicProjects),
    };
  }

  async projects(query: PublicProjectQueryDto): Promise<PublicProject[]> {
    const where: Prisma.ProjectWhereInput = {
      isPublished: true,
      ...(query.category && { category: query.category }),
      ...(query.kind && { kind: query.kind }),
      ...(query.technology && { technologies: { some: { technology: { slug: query.technology } } } }),
    };
    const projects = await this.prisma.project.findMany({
      where,
      include: PROJECT_INCLUDE,
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
    });
    return projects.map((p) => publicProject(toProjectView(p)));
  }

  async project(slug: string): Promise<PublicProject> {
    const project = await this.prisma.project.findFirst({
      where: { slug, isPublished: true },
      include: PROJECT_INCLUDE,
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return publicProject(toProjectView(project));
  }
}

/** Filter options derived from published projects only (never empty filters). */
function projectFilters(projects: PublicProject[]) {
  const technologies = new Map<string, { name: string; slug: string; count: number }>();
  const categories = new Map<ProjectCategory, number>();
  const kinds = new Map<ProjectKind, number>();
  for (const project of projects) {
    categories.set(project.category, (categories.get(project.category) ?? 0) + 1);
    kinds.set(project.kind, (kinds.get(project.kind) ?? 0) + 1);
    for (const tech of project.technologies) {
      const entry = technologies.get(tech.slug) ?? { name: tech.name, slug: tech.slug, count: 0 };
      entry.count++;
      technologies.set(tech.slug, entry);
    }
  }
  return {
    technologies: [...technologies.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    categories: [...categories.entries()].map(([value, count]) => ({ value, count })),
    kinds: [...kinds.entries()].map(([value, count]) => ({ value, count })),
  };
}
