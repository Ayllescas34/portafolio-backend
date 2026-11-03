/**
 * Local seed built ONLY from confirmed information:
 *   - the CV (January 2026 edition), and
 *   - the owner's message: Analista Programador at Canella since February 2026.
 *
 * Anything not confirmed is either omitted or stored unpublished (draft) so it
 * never appears on the public site until the owner reviews it in the admin
 * panel. Private data from the CV (street address, references and their phone
 * numbers) is intentionally NOT seeded.
 *
 * The seed is idempotent: fixed ids / natural keys + upsert.
 */
import {
  DatePrecision,
  EducationStatus,
  EmploymentType,
  ExperienceItemKind,
  HighlightKind,
  Prisma,
  PrismaClient,
  ProjectCategory,
  ProjectStatus,
  SocialPlatform,
  ThemePreference,
} from '@prisma/client';

const prisma = new PrismaClient();
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const TECHNOLOGIES = [
  ['Angular', 'angular'],
  ['NestJS', 'nestjs'],
  ['TypeScript', 'typescript'],
  ['PostgreSQL', 'postgresql'],
  ['MySQL', 'mysql'],
  ['Prisma', 'prisma'],
  ['Three.js', 'threejs'],
  ['SCSS', 'scss'],
  ['Node.js', 'nodejs'],
  ['React Native', 'react-native'],
  ['SQLite', 'sqlite'],
  ['Drizzle ORM', 'drizzle-orm'],
  ['Playwright', 'playwright'],
] as const;

/** [category name, slug, skills[]] — taken from "Habilidades y técnicas" of the CV. */
const SKILLS: [string, string, [name: string, slug: string, featured?: boolean, description?: string][]][] = [
  [
    'Lenguajes',
    'lenguajes',
    [
      ['TypeScript', 'typescript', true],
      ['JavaScript', 'javascript'],
      ['PHP', 'php'],
      ['Java', 'java'],
      ['HTML', 'html'],
      ['CSS', 'css'],
    ],
  ],
  [
    'Backend',
    'backend',
    [
      ['NestJS', 'nestjs', true],
      ['Node.js', 'nodejs'],
      ['Laravel', 'laravel', true],
      ['Spring Boot', 'spring-boot'],
    ],
  ],
  ['Frontend', 'frontend', [['Angular', 'angular', true, 'Angular 17 en adelante']]],
  [
    'Bases de datos',
    'bases-de-datos',
    [
      ['PostgreSQL', 'postgresql', true],
      ['MySQL', 'mysql', true],
      ['MongoDB', 'mongodb'],
      ['Oracle', 'oracle'],
    ],
  ],
  [
    'Cloud y DevOps',
    'cloud-devops',
    [
      ['AWS Amplify', 'aws-amplify'],
      ['AWS S3', 'aws-s3'],
      ['CI/CD', 'ci-cd'],
    ],
  ],
  [
    'Herramientas',
    'herramientas',
    [
      ['Git', 'git'],
      ['GitHub', 'github'],
      ['Postman', 'postman'],
      ['Microsoft Office', 'microsoft-office', false, 'Word y Excel'],
    ],
  ],
  [
    'Soporte técnico',
    'soporte-tecnico',
    [['Mantenimiento de computadoras', 'mantenimiento-computadoras', false, 'Mantenimiento predictivo y correctivo']],
  ],
  [
    'Habilidades blandas',
    'habilidades-blandas',
    [
      ['Resolución de problemas', 'resolucion-de-problemas'],
      ['Aprendizaje autodidacta', 'aprendizaje-autodidacta'],
    ],
  ],
];

/** Fixed ids keep the seed idempotent for entities without a natural key. */
const IDS = {
  canella: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0001',
  muniDev: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0002',
  muniSupport: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0003',
  muniInternship: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0004',
  umg: '1c8e1a2b-7b2c-4d62-8b46-6a7e3a9b0001',
  kinal: '1c8e1a2b-7b2c-4d62-8b46-6a7e3a9b0002',
  hlProblems: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0001',
  hlLearning: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0002',
  hlCode: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0003',
  hlBackend: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0004',
  englishPending: '3e6a3c4d-9d4e-4f84-8d68-8c9a5cbd0001',
} as const;

const MUNI = 'Municipalidad de Antigua Guatemala';
const ANTIGUA = 'Antigua Guatemala, Guatemala';

async function seedSettingsAndProfile(tx: Prisma.TransactionClient) {
  const settings = {
    siteTitle: 'Alejandro Flores Yllescas · Analista Programador',
    siteDescription:
      'Portafolio y hoja de vida de Alejandro Flores Yllescas: Analista Programador con experiencia en desarrollo backend, APIs REST con NestJS y bases de datos PostgreSQL y MySQL.',
    defaultTheme: ThemePreference.DARK,
    defaultLocale: 'es',
    contactFormEnabled: true,
  };
  await tx.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...settings }, update: settings });

  const profile = {
    fullName: 'Alejandro Flores Yllescas',
    professionalTitle: 'Analista Programador · Desarrollo backend',
    shortBio:
      'Estudiante de Ingeniería en Sistemas con formación técnica y experiencia en desarrollo backend. Trabajo con NestJS, Laravel y PostgreSQL, enfocado en resolver problemas y escribir código escalable y eficiente.',
    longBio:
      'Actualmente me desempeño como Analista Programador en Canella. Antes formé parte de la Municipalidad de Antigua Guatemala, donde pasé de las prácticas profesionales y el soporte técnico al rol de desarrollador: gestioné y diseñé bases de datos relacionales en PostgreSQL y MySQL y desarrollé APIs REST con NestJS y Angular.\n\nMi formación técnica como Perito en Computación se complementa con la carrera de Ingeniería en Sistemas de Información, que curso actualmente, y con aprendizaje autodidacta constante.',
    location: ANTIGUA,
    publicEmail: 'ayllescas34@gmail.com',
    // Stored for the printable CV / admin, hidden from the public site until confirmed.
    phone: '+502 0000-0000',
    isPhonePublic: false,
    availability: null,
  };
  await tx.profile.upsert({ where: { id: 1 }, create: { id: 1, ...profile }, update: profile });

  const highlights: [string, HighlightKind, string, string, number][] = [
    [
      IDS.hlProblems,
      HighlightKind.WORK_STYLE,
      'Enfoque en resolver problemas',
      'Parto de entender el problema para llegar a una solución que funcione en el contexto real del proyecto.',
      0,
    ],
    [
      IDS.hlLearning,
      HighlightKind.WORK_STYLE,
      'Aprendizaje autodidacta',
      'Incorporo nuevas herramientas y tecnologías por cuenta propia cuando el trabajo lo requiere.',
      1,
    ],
    [
      IDS.hlCode,
      HighlightKind.VALUE,
      'Código escalable y eficiente',
      'Busco que el código sea claro, mantenible y preparado para crecer.',
      0,
    ],
    [
      IDS.hlBackend,
      HighlightKind.VALUE,
      'Backend y bases de datos',
      'Experiencia diseñando bases de datos relacionales en PostgreSQL y MySQL y desarrollando APIs REST con NestJS.',
      1,
    ],
  ];
  for (const [id, kind, title, description, displayOrder] of highlights) {
    const data = { kind, title, description, displayOrder, isPublished: true };
    await tx.profileHighlight.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  // GitHub user taken from the remote of the owner's local project. Draft until confirmed.
  await tx.socialLink.upsert({
    where: { platform_url: { platform: SocialPlatform.GITHUB, url: 'https://github.com/Ayllescas34' } },
    create: {
      platform: SocialPlatform.GITHUB,
      label: 'GitHub',
      url: 'https://github.com/Ayllescas34',
      isPublished: false,
    },
    update: {},
  });
}

async function seedTechnologies(tx: Prisma.TransactionClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const [name, slug] of TECHNOLOGIES) {
    const tech = await tx.technology.upsert({ where: { slug }, create: { name, slug }, update: { name } });
    ids.set(slug, tech.id);
  }
  return ids;
}

async function seedSkills(tx: Prisma.TransactionClient) {
  for (const [categoryOrder, [name, slug, skills]] of SKILLS.entries()) {
    const category = await tx.skillCategory.upsert({
      where: { slug },
      create: { name, slug, displayOrder: categoryOrder },
      update: { name, displayOrder: categoryOrder },
    });
    for (const [order, [skillName, skillSlug, featured = false, description = null]] of skills.entries()) {
      const data = { categoryId: category.id, name: skillName, description, isFeatured: featured, displayOrder: order };
      await tx.skill.upsert({ where: { slug: skillSlug }, create: { slug: skillSlug, ...data }, update: data });
    }
  }

  // English: the CV shows percentages (40/45/50 %) without a confirmed level.
  // Kept as an unpublished draft so the owner sets a qualitative level first.
  const languages = await tx.skillCategory.upsert({
    where: { slug: 'idiomas' },
    create: { name: 'Idiomas', slug: 'idiomas', displayOrder: SKILLS.length },
    update: {},
  });
  await tx.skill.upsert({
    where: { slug: 'ingles' },
    create: {
      id: IDS.englishPending,
      categoryId: languages.id,
      name: 'Inglés',
      slug: 'ingles',
      description: 'Pendiente de confirmar el nivel.',
      isPublished: false,
    },
    update: {},
  });
}

async function seedExperience(tx: Prisma.TransactionClient, tech: Map<string, string>) {
  type Row = {
    id: string;
    company: string;
    position: string;
    location: string | null;
    employmentType: EmploymentType | null;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    responsibilities: string[];
    technologies: string[];
  };
  const rows: Row[] = [
    {
      // Confirmed by the owner. Responsibilities intentionally left empty until confirmed.
      id: IDS.canella,
      company: 'Canella',
      position: 'Analista Programador',
      location: null,
      employmentType: null,
      startDate: date('2026-02-01'),
      endDate: null,
      isCurrent: true,
      responsibilities: [],
      technologies: [],
    },
    {
      id: IDS.muniDev,
      company: MUNI,
      position: 'Desarrollador',
      location: ANTIGUA,
      employmentType: null,
      startDate: date('2025-02-01'),
      endDate: date('2026-01-01'),
      isCurrent: false,
      responsibilities: [
        'Gestión y diseño de bases de datos relacionales en PostgreSQL y MySQL.',
        'Desarrollo de APIs REST usando NestJS y Angular.',
      ],
      technologies: ['postgresql', 'mysql', 'nestjs', 'angular'],
    },
    {
      id: IDS.muniSupport,
      company: MUNI,
      position: 'Soporte Técnico',
      location: ANTIGUA,
      employmentType: null,
      startDate: date('2024-11-01'),
      endDate: date('2025-01-01'),
      isCurrent: false,
      responsibilities: ['Diagnóstico y mantenimiento de equipos informáticos.'],
      technologies: [],
    },
    {
      id: IDS.muniInternship,
      company: MUNI,
      position: 'Prácticas Profesionales',
      location: ANTIGUA,
      employmentType: EmploymentType.INTERNSHIP,
      startDate: date('2024-08-01'),
      endDate: date('2024-10-01'),
      isCurrent: false,
      responsibilities: [
        'Apoyo en tareas del Departamento de Informática.',
        'Documentación técnica y soporte básico de sistemas.',
      ],
      technologies: [],
    },
  ];

  for (const [displayOrder, row] of rows.entries()) {
    const { id, responsibilities, technologies, ...fields } = row;
    const data = { ...fields, datePrecision: DatePrecision.MONTH, displayOrder, isPublished: true };
    await tx.experience.upsert({ where: { id }, create: { id, ...data }, update: data });
    await tx.experienceItem.deleteMany({ where: { experienceId: id } });
    await tx.experienceItem.createMany({
      data: responsibilities.map((content, order) => ({
        experienceId: id,
        kind: ExperienceItemKind.RESPONSIBILITY,
        content,
        displayOrder: order,
      })),
    });
    await tx.experienceTechnology.deleteMany({ where: { experienceId: id } });
    await tx.experienceTechnology.createMany({
      data: technologies.map((slug) => ({ experienceId: id, technologyId: tech.get(slug)! })),
    });
  }
}

async function seedEducation(tx: Prisma.TransactionClient) {
  const rows = [
    {
      id: IDS.umg,
      institution: 'Universidad Mariano Gálvez de Guatemala',
      program: 'Ingeniería en Sistemas de Información',
      status: EducationStatus.IN_PROGRESS,
      startDate: null,
      endDate: null,
      description: 'Carrera en curso.',
    },
    {
      id: IDS.kinal,
      institution: 'Centro Educativo Técnico Laboral Kinal',
      program: 'Perito en Computación',
      status: EducationStatus.COMPLETED,
      startDate: date('2022-01-01'),
      endDate: date('2024-01-01'),
      description: null,
    },
  ];
  for (const [displayOrder, { id, ...fields }] of rows.entries()) {
    const data = { ...fields, datePrecision: DatePrecision.YEAR, displayOrder, isPublished: true };
    await tx.education.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

async function seedProjects(tx: Prisma.TransactionClient, tech: Map<string, string>) {
  const projects = [
    {
      slug: 'portafolio-profesional',
      title: 'Portafolio profesional e interactivo',
      shortDescription:
        'Portafolio y hoja de vida administrable: el contenido vive en PostgreSQL y se gestiona desde un panel propio.',
      problem:
        'Mantener un CV y un portafolio actualizados implicaba editar documentos a mano y no mostraba cómo construyo software.',
      solution:
        'Aplicación full stack con API REST en NestJS, modelo relacional en PostgreSQL con Prisma, sitio público en Angular con una escena Three.js y un panel administrativo con autenticación local.',
      role: 'Proyecto personal',
      category: ProjectCategory.WEB_APP,
      status: ProjectStatus.IN_PROGRESS,
      isFeatured: true,
      isPublished: true,
      technologies: ['angular', 'nestjs', 'typescript', 'postgresql', 'prisma', 'threejs', 'scss', 'playwright'],
    },
    {
      // Draft: described from the project's own documentation; publish after review.
      slug: 'control-de-gastos',
      title: 'Control de Gastos (app móvil)',
      shortDescription:
        'Aplicación móvil personal para registrar ingresos y gastos, con presupuestos, metas de ahorro y reportes mensuales.',
      problem: 'Llevar el control de finanzas personales de forma ordenada y consultable desde el teléfono.',
      solution:
        'App en React Native con TypeScript y persistencia local en SQLite (Drizzle ORM): movimientos, cuentas, categorías, presupuestos, metas de ahorro, respaldo en JSON y reportes mensuales.',
      role: 'Proyecto personal',
      category: ProjectCategory.MOBILE_APP,
      status: ProjectStatus.IN_PROGRESS,
      isFeatured: false,
      isPublished: false,
      technologies: ['react-native', 'typescript', 'sqlite', 'drizzle-orm'],
    },
  ];
  for (const [displayOrder, { slug, technologies, ...fields }] of projects.entries()) {
    const project = await tx.project.upsert({
      where: { slug },
      create: { slug, ...fields, displayOrder },
      update: { ...fields, displayOrder },
    });
    await tx.projectTechnology.deleteMany({ where: { projectId: project.id } });
    await tx.projectTechnology.createMany({
      data: technologies.map((s) => ({ projectId: project.id, technologyId: tech.get(s)! })),
    });
  }
}

async function main() {
  await prisma.$transaction(
    async (tx) => {
      await seedSettingsAndProfile(tx);
      const tech = await seedTechnologies(tx);
      await seedSkills(tx);
      await seedExperience(tx, tech);
      await seedEducation(tx);
      await seedProjects(tx, tech);
    },
    { timeout: 30_000 },
  );
  console.log('Seed aplicado: perfil, experiencia, educación, habilidades y proyectos.');
}

main()
  .catch((error) => {
    console.error('Error al aplicar el seed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
