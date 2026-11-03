import { Experience, ExperienceItem, ExperienceItemKind, Prisma } from '@prisma/client';
import { TECHNOLOGY_SUMMARY_SELECT, TechnologySummary } from '../technologies/technology-links';

export const EXPERIENCE_INCLUDE = {
  items: { orderBy: { displayOrder: 'asc' } },
  technologies: {
    select: { technology: { select: TECHNOLOGY_SUMMARY_SELECT } },
    orderBy: { technology: { name: 'asc' } },
  },
} satisfies Prisma.ExperienceInclude;

type ExperienceRecord = Experience & {
  items: ExperienceItem[];
  technologies: { technology: TechnologySummary }[];
};

export type ExperienceView = Experience & {
  responsibilities: string[];
  achievements: string[];
  technologies: TechnologySummary[];
};

/** Flattens join rows into the shape both the admin and public APIs return. */
export function toExperienceView({ items, technologies, ...experience }: ExperienceRecord): ExperienceView {
  const byKind = (kind: ExperienceItemKind) => items.filter((i) => i.kind === kind).map((i) => i.content);
  return {
    ...experience,
    responsibilities: byKind(ExperienceItemKind.RESPONSIBILITY),
    achievements: byKind(ExperienceItemKind.ACHIEVEMENT),
    technologies: technologies.map((t) => t.technology),
  };
}
