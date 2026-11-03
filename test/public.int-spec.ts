import { createTestApp, resetDatabase, seedSingletons, TestContext } from './helpers';

describe('Public API (integration)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.app.close());
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await seedSingletons(ctx.prisma);
  });

  async function seedProjects() {
    const angular = await ctx.prisma.technology.create({ data: { name: 'Angular', slug: 'angular' } });
    const nest = await ctx.prisma.technology.create({ data: { name: 'NestJS', slug: 'nestjs' } });
    await ctx.prisma.project.create({
      data: {
        title: 'Publicado',
        slug: 'publicado',
        shortDescription: 'Visible',
        isPublished: true,
        isFeatured: true,
        technologies: { create: [{ technologyId: angular.id }, { technologyId: nest.id }] },
      },
    });
    await ctx.prisma.project.create({
      data: {
        title: 'API',
        slug: 'api',
        shortDescription: 'Visible',
        category: 'API',
        isPublished: true,
        technologies: { create: [{ technologyId: nest.id }] },
      },
    });
    await ctx.prisma.project.create({
      data: { title: 'Borrador', slug: 'borrador', shortDescription: 'Oculto', isPublished: false },
    });
  }

  it('GET /api/health reports the database', async () => {
    const res = await ctx.http().get('/api/health').expect(200);
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('portfolio returns only published content and hides private data', async () => {
    await seedProjects();
    await ctx.prisma.experience.create({
      data: { company: 'Visible SA', position: 'Dev', startDate: new Date('2025-01-01'), isCurrent: true },
    });
    await ctx.prisma.experience.create({
      data: {
        company: 'Oculta SA',
        position: 'Dev',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-01'),
        isPublished: false,
      },
    });

    const { body } = await ctx.http().get('/api/public/portfolio').expect(200);
    const data = body.data;

    expect(data.profile.fullName).toBe('Persona de Prueba');
    expect(data.profile.phone).toBeNull(); // isPhonePublic = false
    expect(data.projects.map((p: { slug: string }) => p.slug)).toEqual(['publicado', 'api']);
    expect(data.experiences.map((e: { company: string }) => e.company)).toEqual(['Visible SA']);
    expect(data.projectFilters.technologies).toEqual([
      { name: 'NestJS', slug: 'nestjs', count: 2 },
      { name: 'Angular', slug: 'angular', count: 1 },
    ]);
    expect(JSON.stringify(data)).not.toMatch(/isPublished|passwordHash/);
  });

  it('exposes the hero tagline and filters projects by kind', async () => {
    await ctx.prisma.profile.update({ where: { id: 1 }, data: { tagline: 'Texto complementario' } });
    await ctx.prisma.project.create({
      data: { title: 'Caso', slug: 'caso', shortDescription: 'x', kind: 'PROFESSIONAL', isPublished: true },
    });
    await ctx.prisma.project.create({
      data: { title: 'Personal', slug: 'personal', shortDescription: 'x', isPublished: true },
    });

    const { body } = await ctx.http().get('/api/public/portfolio').expect(200);
    expect(body.data.profile.tagline).toBe('Texto complementario');
    expect(body.data.projectFilters.kinds).toEqual(
      expect.arrayContaining([
        { value: 'PROFESSIONAL', count: 1 },
        { value: 'PERSONAL', count: 1 },
      ]),
    );
    const professional = await ctx.http().get('/api/public/projects?kind=PROFESSIONAL').expect(200);
    expect(professional.body.data.map((p: { slug: string }) => p.slug)).toEqual(['caso']);
    await ctx.http().get('/api/public/projects?kind=SECRETO').expect(400);
  });

  it('shows the phone only when marked public', async () => {
    await ctx.prisma.profile.update({ where: { id: 1 }, data: { isPhonePublic: true } });
    const { body } = await ctx.http().get('/api/public/portfolio').expect(200);
    expect(body.data.profile.phone).toBe('+502 0000-0000');
  });

  it('filters projects by technology and category', async () => {
    await seedProjects();
    const byTech = await ctx.http().get('/api/public/projects?technology=angular').expect(200);
    expect(byTech.body.data.map((p: { slug: string }) => p.slug)).toEqual(['publicado']);
    const byCategory = await ctx.http().get('/api/public/projects?category=API').expect(200);
    expect(byCategory.body.data.map((p: { slug: string }) => p.slug)).toEqual(['api']);
    await ctx.http().get('/api/public/projects?category=NOPE').expect(400);
  });

  it('project detail is available only for published projects', async () => {
    await seedProjects();
    const res = await ctx.http().get('/api/public/projects/publicado').expect(200);
    expect(res.body.data.technologies.map((t: { slug: string }) => t.slug)).toEqual(['angular', 'nestjs']);
    await ctx.http().get('/api/public/projects/borrador').expect(404);
    await ctx.http().get('/api/public/projects/no-existe').expect(404);
  });

  describe('contact form', () => {
    const message = {
      name: 'Ana',
      email: 'ana@example.com',
      subject: 'Oportunidad',
      message: 'Me gustaría conversar.',
    };

    it('stores valid messages locally', async () => {
      await ctx.http().post('/api/public/contact').send(message).expect(202);
      const stored = await ctx.prisma.contactMessage.findMany();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ ...message, status: 'NEW', readAt: null });
    });

    it('rejects invalid messages with field details', async () => {
      const res = await ctx
        .http()
        .post('/api/public/contact')
        .send({ ...message, email: 'x' })
        .expect(400);
      expect(res.body.error.details[0].field).toBe('email');
      expect(await ctx.prisma.contactMessage.count()).toBe(0);
    });

    it('accepts but discards honeypot submissions', async () => {
      await ctx
        .http()
        .post('/api/public/contact')
        .send({ ...message, website: 'spam' })
        .expect(202);
      expect(await ctx.prisma.contactMessage.count()).toBe(0);
    });

    it('is unavailable when disabled in the settings', async () => {
      await ctx.prisma.siteSettings.update({ where: { id: 1 }, data: { contactFormEnabled: false } });
      await ctx.http().post('/api/public/contact').send(message).expect(503);
    });

    it('rejects oversized bodies', async () => {
      await ctx
        .http()
        .post('/api/public/contact')
        .send({ ...message, message: 'x'.repeat(200_000) })
        .expect(413);
    });
  });
});
