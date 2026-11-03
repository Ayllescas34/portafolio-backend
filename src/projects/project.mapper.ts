import { Prisma, Project, ProjectImage, ProjectResponsibility } from '@prisma/client';
import { TECHNOLOGY_SUMMARY_SELECT, TechnologySummary } from '../technologies/technology-links';

export const PROJECT_INCLUDE = {
  technologies: {
    select: { technology: { select: TECHNOLOGY_SUMMARY_SELECT } },
    orderBy: { technology: { name: 'asc' } },
  },
  responsibilities: { orderBy: { displayOrder: 'asc' } },
  images: { orderBy: { displayOrder: 'asc' } },
} satisfies Prisma.ProjectInclude;

type ProjectRecord = Project & {
  technologies: { technology: TechnologySummary }[];
  responsibilities: ProjectResponsibility[];
  images: ProjectImage[];
};

export type ProjectView = Project & {
  technologies: TechnologySummary[];
  responsibilities: string[];
  images: Pick<ProjectImage, 'id' | 'imageUrl' | 'altText' | 'caption'>[];
};

export function toProjectView({ technologies, responsibilities, images, ...project }: ProjectRecord): ProjectView {
  return {
    ...project,
    technologies: technologies.map((t) => t.technology),
    responsibilities: responsibilities.map((r) => r.content),
    images: images.map(({ id, imageUrl, altText, caption }) => ({ id, imageUrl, altText, caption })),
  };
}
