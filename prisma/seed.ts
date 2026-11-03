/**
 * Local seed built ONLY from confirmed information:
 *   - the CV (January 2026 edition), and
 *   - the owner's messages: Analista Programador (Full Stack) at Canella since
 *     February 2026, working on .NET 8 migrations, frontend, backend, databases,
 *     functional/technical testing, CI/CD, OpenShift and IIS deployments, and
 *   - the owner's public repositories, for the project descriptions.
 *
 * Nothing is invented: no years of experience, percentages, metrics, clients
 * or confidential details. Unconfirmed items are stored unpublished (drafts).
 * Private CV data (phone, street address, references) is intentionally NOT
 * seeded: this file is public. The phone is entered from the admin panel.
 *
 * Idempotent: fixed ids / natural keys + upsert. On existing projects the
 * owner's publication choice (isPublished) is never overwritten.
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
  ProjectKind,
  ProjectStatus,
  SocialPlatform,
  ThemePreference,
  WorkMode,
} from '@prisma/client';

const prisma = new PrismaClient();
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const TECHNOLOGIES = [
  ['.NET 8', 'dotnet-8'],
  ['Angular', 'angular'],
  ['NestJS', 'nestjs'],
  ['TypeScript', 'typescript'],
  ['PostgreSQL', 'postgresql'],
  ['MySQL', 'mysql'],
  ['OpenShift', 'openshift'],
  ['IIS', 'iis'],
  ['CI/CD', 'ci-cd'],
  ['Prisma', 'prisma'],
  ['Three.js', 'threejs'],
  ['SCSS', 'scss'],
  ['Node.js', 'nodejs'],
  ['React Native', 'react-native'],
  ['SQLite', 'sqlite'],
  ['Drizzle ORM', 'drizzle-orm'],
  ['Playwright', 'playwright'],
  ['Next.js', 'nextjs'],
  ['Payload CMS', 'payload-cms'],
  ['React', 'react'],
  ['Vite', 'vite'],
  ['Supabase', 'supabase'],
  ['Tailwind CSS', 'tailwind-css'],
  ['Vercel', 'vercel'],
  ['JavaScript', 'javascript'],
  ['HTML y CSS', 'html-css'],
] as const;

type SkillRow = [name: string, slug: string, featured?: boolean, description?: string];

/** Professional areas (not a logo cloud). Skills keep their slugs, so re-seeding moves them. */
const SKILL_AREAS: [name: string, slug: string, description: string, skills: SkillRow[]][] = [
  [
    'Desarrollo frontend',
    'frontend',
    'Interfaces web, formularios y su integración con los servicios de la aplicación.',
    [
      ['Angular', 'angular', true, 'Angular 17 en adelante'],
      ['TypeScript', 'typescript', true],
      ['JavaScript', 'javascript'],
      ['HTML', 'html'],
      ['CSS', 'css'],
      ['Implementación de interfaces', 'implementacion-de-interfaces'],
      ['Integración con APIs', 'integracion-con-apis', false, 'Consumo de servicios REST desde la interfaz'],
      ['Formularios y validación', 'formularios-y-validacion'],
    ],
  ],
  [
    'Desarrollo backend',
    'backend',
    'Servicios, APIs REST, lógica de negocio y migración de aplicaciones.',
    [
      ['.NET 8', 'dotnet-8', true, 'Migración y modernización de aplicaciones'],
      ['NestJS', 'nestjs', true],
      ['Node.js', 'nodejs'],
      ['Laravel', 'laravel'],
      ['Spring Boot', 'spring-boot'],
      ['PHP', 'php'],
      ['Java', 'java'],
      ['APIs REST', 'apis-rest'],
      ['Integración entre componentes', 'integracion-entre-componentes'],
    ],
  ],
  [
    'Bases de datos',
    'bases-de-datos',
    'Diseño de bases de datos relacionales, consultas e integración con las aplicaciones.',
    [
      ['PostgreSQL', 'postgresql', true],
      ['MySQL', 'mysql'],
      ['MongoDB', 'mongodb'],
      ['Oracle', 'oracle'],
      ['Diseño y modelado relacional', 'modelado-relacional'],
    ],
  ],
  [
    'Calidad y pruebas',
    'calidad-y-pruebas',
    'Verificación funcional y técnica antes y después de cada publicación.',
    [
      ['Pruebas funcionales', 'pruebas-funcionales'],
      ['Pruebas técnicas', 'pruebas-tecnicas'],
      ['Validación de despliegues', 'validacion-de-despliegues'],
    ],
  ],
  [
    'DevOps y despliegue',
    'devops-y-despliegue',
    'Integración y despliegue continuo, contenedores y publicación de aplicaciones.',
    [
      ['OpenShift', 'openshift', true],
      ['IIS', 'iis', true, 'Publicación y validación de aplicaciones'],
      ['CI/CD', 'ci-cd', false, 'Integración y despliegue continuo'],
      ['Contenedores', 'contenedores'],
      ['AWS Amplify', 'aws-amplify'],
      ['AWS S3', 'aws-s3'],
    ],
  ],
  [
    'Arquitectura y prácticas',
    'arquitectura-y-practicas',
    'Código mantenible, control de versiones y documentación técnica.',
    [
      ['Migración y modernización de aplicaciones', 'modernizacion-de-aplicaciones'],
      ['Git', 'git'],
      ['GitHub', 'github'],
      ['Postman', 'postman'],
      ['Documentación técnica', 'documentacion-tecnica'],
    ],
  ],
  [
    'Competencias complementarias',
    'competencias-complementarias',
    'Habilidades de trabajo y soporte respaldadas por la trayectoria.',
    [
      ['Resolución de problemas', 'resolucion-de-problemas'],
      ['Aprendizaje autodidacta', 'aprendizaje-autodidacta'],
      ['Mantenimiento de computadoras', 'mantenimiento-computadoras', false, 'Mantenimiento predictivo y correctivo'],
      ['Microsoft Office', 'microsoft-office', false, 'Word y Excel'],
    ],
  ],
];

/** Categories from the first version of the seed, removed once empty. */
const RETIRED_CATEGORIES = ['lenguajes', 'herramientas', 'cloud-devops', 'soporte-tecnico', 'habilidades-blandas'];

/** Fixed ids keep the seed idempotent for entities without a natural key. */
const IDS = {
  canella: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0001',
  muniDev: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0002',
  muniSupport: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0003',
  muniInternship: '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0004',
  umg: '1c8e1a2b-7b2c-4d62-8b46-6a7e3a9b0001',
  kinal: '1c8e1a2b-7b2c-4d62-8b46-6a7e3a9b0002',
  hl1: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0001',
  hl2: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0002',
  hl3: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0003',
  hl4: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0004',
  hl5: '2d7f2b3c-8c3d-4e73-9c57-7b8f4bac0005',
  stage: (n: number) => `4f5b4d5e-0e5f-4a95-8e79-9dab6cde000${n}`,
  englishPending: '3e6a3c4d-9d4e-4f84-8d68-8c9a5cbd0001',
} as const;

const MUNI = 'Municipalidad de Antigua Guatemala';
const ANTIGUA = 'Antigua Guatemala, Guatemala';

async function seedSettingsAndProfile(tx: Prisma.TransactionClient) {
  const settings = {
    siteTitle: 'Alejandro Flores Yllescas | Analista Programador Full Stack',
    siteDescription:
      'Portafolio profesional de Alejandro Flores Yllescas, Analista Programador Full Stack con experiencia en desarrollo y modernización de aplicaciones, .NET 8, bases de datos, pruebas, DevOps, OpenShift e IIS.',
    defaultTheme: ThemePreference.DARK,
    defaultLocale: 'es',
    contactFormEnabled: true,
  };
  await tx.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...settings }, update: settings });

  const profile = {
    fullName: 'Alejandro Flores Yllescas',
    professionalTitle: 'Analista Programador Full Stack',
    shortBio:
      'Desarrollo, modernización y despliegue de aplicaciones empresariales, con participación en frontend, backend, bases de datos, pruebas y procesos DevOps.',
    tagline:
      'Experiencia en migración de aplicaciones hacia .NET 8, integración y despliegue continuo, OpenShift y publicación y validación de soluciones en IIS.',
    longBio: [
      'Trabajo en el desarrollo y la modernización de aplicaciones empresariales. Participo en las distintas capas de una solución —interfaces, servicios, lógica de negocio y bases de datos— y acompaño el software más allá del código: pruebas, preparación para el despliegue y validación en los ambientes donde se publica.',
      'Actualmente, en Canella, colaboro en la migración de aplicaciones hacia .NET 8 y en los procesos de integración y despliegue continuo, incluidos los flujos con OpenShift y la publicación y validación de aplicaciones en IIS.',
      'Antes, en la Municipalidad de Antigua Guatemala, pasé de las prácticas profesionales y el soporte técnico al desarrollo, donde diseñé bases de datos relacionales en PostgreSQL y MySQL y construí APIs REST con NestJS y Angular. Complemento esta experiencia con la carrera de Ingeniería en Sistemas de Información, que curso actualmente.',
    ].join('\n\n'),
    location: ANTIGUA,
    publicEmail: 'ayllescas34@gmail.com',
    isPhonePublic: false,
    availability: null,
  };
  await tx.profile.upsert({ where: { id: 1 }, create: { id: 1, ...profile }, update: profile });

  const highlights: [string, HighlightKind, string, string, number][] = [
    [
      IDS.hl1,
      HighlightKind.WORK_STYLE,
      'Visión de ciclo completo',
      'Sigo cada cambio desde su desarrollo hasta su despliegue y validación, no solo hasta que el código compila.',
      0,
    ],
    [
      IDS.hl2,
      HighlightKind.WORK_STYLE,
      'Calidad antes de publicar',
      'Las pruebas funcionales y técnicas forman parte del proceso de entrega, antes y después de cada publicación.',
      1,
    ],
    [
      IDS.hl3,
      HighlightKind.WORK_STYLE,
      'Aprendizaje continuo',
      'Incorporo nuevas herramientas y tecnologías de forma autodidacta cuando el trabajo lo requiere.',
      2,
    ],
    [
      IDS.hl4,
      HighlightKind.VALUE,
      'Modernización tecnológica',
      'Participación en la migración y modernización de aplicaciones empresariales hacia .NET 8.',
      0,
    ],
    [
      IDS.hl5,
      HighlightKind.VALUE,
      'Código mantenible',
      'Busco soluciones claras, escalables y fáciles de mantener por el resto del equipo.',
      1,
    ],
  ];
  const stages: [string, string][] = [
    [
      'Experiencia de usuario',
      'Interfaces claras y consistentes, con formularios y estados pensados para quien usa la aplicación.',
    ],
    [
      'Desarrollo frontend',
      'Implementación y mantenimiento de funcionalidades de interfaz integradas con los servicios.',
    ],
    [
      'Backend y lógica de negocio',
      'Servicios, APIs y reglas de negocio, incluida la migración de aplicaciones hacia .NET 8.',
    ],
    ['Datos', 'Modelado, consultas e integración de bases de datos relacionales con las aplicaciones.'],
    ['Pruebas', 'Pruebas funcionales y técnicas para verificar cada cambio antes de publicarlo.'],
    [
      'Integración y entrega continua',
      'Participación en flujos de integración y despliegue continuo, incluidos los de OpenShift.',
    ],
    [
      'Despliegue y validación',
      'Preparación, publicación y validación de aplicaciones en IIS, con seguimiento posterior.',
    ],
  ];
  stages.forEach(([title, description], i) =>
    highlights.push([IDS.stage(i + 1), HighlightKind.DELIVERY_STAGE, title, description, i]),
  );

  for (const [id, kind, title, description, displayOrder] of highlights) {
    const data = { kind, title, description, displayOrder, isPublished: true };
    await tx.profileHighlight.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  const socialLinks: [SocialPlatform, string, string][] = [
    [SocialPlatform.LINKEDIN, 'LinkedIn', 'https://www.linkedin.com/in/oscar-alejandro-flores-yllescas-365b66249/'],
    [SocialPlatform.GITHUB, 'GitHub', 'https://github.com/Ayllescas34'],
  ];
  for (const [displayOrder, [platform, label, url]] of socialLinks.entries()) {
    const data = { label, displayOrder, isPublished: true };
    await tx.socialLink.upsert({
      where: { platform_url: { platform, url } },
      create: { platform, url, ...data },
      update: data,
    });
  }
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
  for (const [categoryOrder, [name, slug, description, skills]] of SKILL_AREAS.entries()) {
    const category = await tx.skillCategory.upsert({
      where: { slug },
      create: { name, slug, description, displayOrder: categoryOrder },
      update: { name, description, displayOrder: categoryOrder },
    });
    for (const [order, [skillName, skillSlug, featured = false, skillDescription = null]] of skills.entries()) {
      const data = {
        categoryId: category.id,
        name: skillName,
        description: skillDescription,
        isFeatured: featured,
        displayOrder: order,
      };
      await tx.skill.upsert({ where: { slug: skillSlug }, create: { slug: skillSlug, ...data }, update: data });
    }
  }

  // English: the CV shows percentages (40/45/50 %) without a confirmed level.
  // Kept as an unpublished draft so the owner sets a qualitative level first.
  const languages = await tx.skillCategory.upsert({
    where: { slug: 'idiomas' },
    create: { name: 'Idiomas', slug: 'idiomas', displayOrder: SKILL_AREAS.length },
    update: { displayOrder: SKILL_AREAS.length },
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

  // Categories from the previous taxonomy are removed only when they are empty.
  await tx.skillCategory.deleteMany({ where: { slug: { in: RETIRED_CATEGORIES }, skills: { none: {} } } });
}

async function seedExperience(tx: Prisma.TransactionClient, tech: Map<string, string>) {
  type Row = {
    id: string;
    company: string;
    position: string;
    location: string | null;
    workMode?: WorkMode;
    employmentType: EmploymentType | null;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    summary: string | null;
    responsibilities: string[];
    technologies: string[];
  };
  const rows: Row[] = [
    {
      id: IDS.canella,
      company: 'Canella',
      position: 'Analista Programador',
      location: 'Ciudad de Guatemala, Guatemala',
      workMode: WorkMode.REMOTE,
      employmentType: null,
      startDate: date('2026-02-01'),
      endDate: null,
      isCurrent: true,
      summary:
        'Enfoque Full Stack: desarrollo y modernización de aplicaciones empresariales, desde la implementación y las pruebas hasta el despliegue y la validación.',
      responsibilities: [
        'Desarrollo y modernización de aplicaciones empresariales.',
        'Participación en migraciones de aplicaciones hacia .NET 8.',
        'Implementación y mantenimiento de funcionalidades de frontend y backend.',
        'Trabajo con bases de datos e integración entre componentes.',
        'Ejecución de pruebas funcionales y técnicas.',
        'Participación en procesos de integración y despliegue continuo.',
        'Preparación, publicación y validación de aplicaciones en IIS.',
        'Participación en flujos de despliegue mediante OpenShift.',
        'Colaboración durante las distintas etapas del ciclo de desarrollo y entrega.',
      ],
      technologies: ['dotnet-8', 'openshift', 'iis', 'ci-cd'],
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
      summary: null,
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
      summary: null,
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
      summary: null,
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
      description: 'Finalizando el cuarto semestre.',
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
      // General description only: no systems, clients, repositories or internal data.
      slug: 'modernizacion-aplicaciones-empresariales',
      title: 'Modernización de aplicaciones empresariales',
      kind: ProjectKind.PROFESSIONAL,
      shortDescription:
        'Participación en la migración de aplicaciones empresariales hacia .NET 8, desde el desarrollo y las pruebas hasta el despliegue y la validación.',
      context:
        'Trabajo actual como Analista Programador en Canella, dentro de un entorno de aplicaciones empresariales en proceso de modernización.',
      problem: null,
      solution:
        'Migración de aplicaciones hacia .NET 8 con un enfoque de ciclo completo: implementación en frontend y backend, trabajo con bases de datos, pruebas funcionales y técnicas, integración y despliegue continuo con OpenShift, y publicación y validación en IIS.',
      architecture: null,
      challenges: null,
      outcome: null,
      role: 'Analista Programador Full Stack',
      responsibilities: [
        'Migración y modernización de aplicaciones hacia .NET 8.',
        'Implementación de funcionalidades de frontend y backend.',
        'Pruebas funcionales y técnicas.',
        'Integración y despliegue continuo mediante OpenShift.',
        'Publicación y validación de aplicaciones en IIS.',
      ],
      category: ProjectCategory.WEB_APP,
      status: ProjectStatus.IN_PROGRESS,
      startDate: date('2026-02-01'),
      isFeatured: true,
      publishOnCreate: true,
      technologies: ['dotnet-8', 'openshift', 'iis', 'ci-cd'],
    },
    {
      // Described from the public repository.
      slug: 'hotel-quinta-vista-verde',
      title: 'Hotel Quinta Vista Verde (sitio web)',
      kind: ProjectKind.PERSONAL,
      shortDescription:
        'Sitio web de un hotel familiar en Antigua Guatemala, con panel de administración de contenidos y consultas directas por WhatsApp.',
      context:
        'Sitio público del hotel: habitaciones, carta de desayunos, promociones, galería, experiencias, reseñas, ubicación y contacto.',
      problem: null,
      solution:
        'Aplicación en Next.js con Payload CMS integrado: el contenido de cada sección se edita desde un panel de administración, sin tocar código. Las habitaciones y los desayunos abren una conversación de WhatsApp con un mensaje ya preparado.',
      architecture:
        'Next.js y Payload CMS en una sola aplicación, con PostgreSQL o SQLite según el entorno e imágenes en Vercel Blob. Incluye metadatos, sitemap y robots para SEO.',
      challenges: null,
      outcome: 'Sitio publicado en Vercel.',
      role: 'Desarrollo del sitio y del panel de contenidos',
      responsibilities: [],
      category: ProjectCategory.WEB_APP,
      status: ProjectStatus.COMPLETED,
      startDate: null,
      isFeatured: false,
      publishOnCreate: true,
      repositoryUrl: 'https://github.com/Ayllescas34/landing_hqvv',
      liveUrl: 'https://landing-hqvv.vercel.app',
      technologies: ['nextjs', 'payload-cms', 'react', 'typescript', 'postgresql', 'sqlite', 'tailwind-css', 'vercel'],
    },
    {
      // Described from the public repository.
      slug: 'album-mundial-2026',
      title: 'Álbum Mundial 2026',
      kind: ProjectKind.PERSONAL,
      shortDescription:
        'Aplicación web para llevar el control de las estampas del álbum del Mundial 2026: las que tienes, las repetidas y las que faltan.',
      context: 'Proyecto personal multiusuario para seguir el avance del álbum.',
      problem: null,
      solution:
        'Registro por correo, grilla de estampas por selección, apertura de sobres estampa por estampa, lista de repetidas, buscador y estadísticas de progreso. También incluye perfiles, amigos y un reporte del álbum en PDF.',
      architecture:
        'React con Vite y TypeScript en el frontend; Supabase para autenticación y PostgreSQL, con los datos de cada usuario aislados mediante Row Level Security.',
      challenges: null,
      outcome: 'Aplicación publicada en Vercel.',
      role: 'Proyecto personal',
      responsibilities: [],
      category: ProjectCategory.WEB_APP,
      status: ProjectStatus.COMPLETED,
      startDate: null,
      isFeatured: false,
      publishOnCreate: true,
      liveUrl: 'https://mundial-2026-zeta.vercel.app',
      technologies: ['react', 'vite', 'typescript', 'tailwind-css', 'supabase', 'postgresql', 'vercel'],
    },
    {
      slug: 'portafolio-profesional',
      title: 'Portafolio profesional e interactivo',
      kind: ProjectKind.PERSONAL,
      shortDescription:
        'Portafolio y hoja de vida administrables: el contenido vive en PostgreSQL y se gestiona desde un panel propio.',
      context: 'Proyecto personal para presentar el perfil profesional y mantenerlo actualizado sin editar código.',
      problem:
        'Mantener un CV y un portafolio actualizados implicaba editar documentos a mano y no mostraba cómo construyo software.',
      solution:
        'Aplicación full stack con API REST en NestJS, modelo relacional en PostgreSQL con Prisma, sitio público en Angular con una escena Three.js y un panel administrativo con autenticación local.',
      architecture:
        'Frontend Angular (componentes standalone y signals) separado de una API NestJS por capas; PostgreSQL con migraciones versionadas; sesión mediante cookie httpOnly; pruebas unitarias, de integración y end-to-end.',
      challenges: null,
      outcome: 'Aplicación funcionando en entorno local, con su suite de pruebas automatizadas en verde.',
      role: 'Proyecto personal',
      responsibilities: [],
      category: ProjectCategory.WEB_APP,
      status: ProjectStatus.IN_PROGRESS,
      startDate: null,
      isFeatured: false,
      publishOnCreate: true,
      repositoryUrl: 'https://github.com/Ayllescas34/portafolio-front',
      technologies: ['angular', 'nestjs', 'typescript', 'postgresql', 'prisma', 'threejs', 'scss', 'playwright'],
    },
    {
      // Described from the project's own documentation.
      slug: 'control-de-gastos',
      title: 'Control de Gastos (app móvil)',
      kind: ProjectKind.PERSONAL,
      shortDescription:
        'Aplicación móvil personal para registrar ingresos y gastos, con presupuestos, metas de ahorro y reportes mensuales.',
      context:
        'Proyecto personal de control financiero, con una aplicación móvil multiplataforma y un backend planificado.',
      problem: 'Llevar el control de finanzas personales de forma ordenada y consultable desde el teléfono.',
      solution:
        'App en React Native con TypeScript y persistencia local en SQLite (Drizzle ORM): movimientos, cuentas, categorías, presupuestos, metas de ahorro, respaldo en JSON y reportes mensuales.',
      architecture:
        'Organización por funcionalidades con dominio, datos y pantallas separados; persistencia local en SQLite con migraciones; lógica de negocio en TypeScript.',
      challenges: null,
      outcome: null,
      role: 'Proyecto personal',
      responsibilities: [],
      category: ProjectCategory.MOBILE_APP,
      status: ProjectStatus.IN_PROGRESS,
      startDate: null,
      isFeatured: false,
      publishOnCreate: false,
      technologies: ['react-native', 'typescript', 'sqlite', 'drizzle-orm'],
    },
    {
      // Described from the public repository.
      slug: 'newton-umg',
      title: 'NewtonUMG: simulador de las leyes de Newton',
      kind: ProjectKind.ACADEMIC,
      shortDescription:
        'Calculadora y simulador web de problemas de la segunda y tercera ley de Newton, con solución paso a paso y animación.',
      context: 'Laboratorio 2 del curso de Física en la Universidad Mariano Gálvez.',
      problem: null,
      solution:
        'Dos problemas interactivos: una masa con fricción unida por polea a una masa colgante y dos bloques apilados. A partir de los datos ingresados, la aplicación resuelve el sistema, muestra cada paso del desarrollo y lo anima.',
      architecture: 'Sitio estático en HTML, CSS y JavaScript, con el motor de cálculo separado de la animación.',
      challenges: null,
      outcome: 'Publicado en Vercel.',
      role: 'Proyecto académico',
      responsibilities: [],
      category: ProjectCategory.TOOL,
      status: ProjectStatus.COMPLETED,
      startDate: null,
      isFeatured: false,
      publishOnCreate: true,
      repositoryUrl: 'https://github.com/Ayllescas34/fisica-newton',
      liveUrl: 'https://fisica-newton.vercel.app',
      technologies: ['javascript', 'html-css', 'tailwind-css', 'vercel'],
    },
  ];

  for (const [displayOrder, project] of projects.entries()) {
    const { slug, technologies, responsibilities, publishOnCreate, ...fields } = project;
    const saved = await tx.project.upsert({
      where: { slug },
      create: { slug, ...fields, displayOrder, isPublished: publishOnCreate },
      // isPublished is deliberately not updated: it is the owner's decision in the admin panel.
      update: { ...fields, displayOrder },
    });
    await tx.projectTechnology.deleteMany({ where: { projectId: saved.id } });
    await tx.projectTechnology.createMany({
      data: technologies.map((s) => ({ projectId: saved.id, technologyId: tech.get(s)! })),
    });
    await tx.projectResponsibility.deleteMany({ where: { projectId: saved.id } });
    await tx.projectResponsibility.createMany({
      data: responsibilities.map((content, order) => ({ projectId: saved.id, content, displayOrder: order })),
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
  console.log('Seed aplicado: perfil, flujo de entrega, experiencia, educación, capacidades y proyectos.');
}

main()
  .catch((error) => {
    console.error('Error al aplicar el seed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
