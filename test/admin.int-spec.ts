import { createAdmin, createTestApp, login, resetDatabase, seedSingletons, TestContext } from './helpers';

describe('Admin API (integration)', () => {
  let ctx: TestContext;
  let cookie: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.app.close());
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await seedSingletons(ctx.prisma);
    await createAdmin(ctx.prisma);
    cookie = await login(ctx);
  });

  const authed = {
    get: (url: string) => ctx.http().get(url).set('Cookie', cookie),
    post: (url: string, body: object) => ctx.http().post(url).set('Cookie', cookie).send(body),
    patch: (url: string, body: object) => ctx.http().patch(url).set('Cookie', cookie).send(body),
    put: (url: string, body: object) => ctx.http().put(url).set('Cookie', cookie).send(body),
    delete: (url: string) => ctx.http().delete(url).set('Cookie', cookie),
  };

  describe('permissions', () => {
    const routes: [method: 'get' | 'post' | 'patch' | 'put' | 'delete', url: string][] = [
      ['get', '/api/admin/profile'],
      ['put', '/api/admin/profile'],
      ['get', '/api/admin/site-settings'],
      ['get', '/api/admin/profile-highlights'],
      ['get', '/api/admin/experiences'],
      ['post', '/api/admin/experiences'],
      ['get', '/api/admin/education'],
      ['get', '/api/admin/skill-categories'],
      ['get', '/api/admin/skills'],
      ['get', '/api/admin/technologies'],
      ['get', '/api/admin/projects'],
      ['post', '/api/admin/projects'],
      ['delete', '/api/admin/projects/0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0001'],
      ['get', '/api/admin/certifications'],
      ['get', '/api/admin/social-links'],
      ['get', '/api/admin/contact-messages'],
      ['post', '/api/admin/media'],
      ['patch', '/api/admin/account/password'],
      ['post', '/api/auth/logout'],
    ];

    it.each(routes)('%s %s requires a session', async (method, url) => {
      const res = await ctx.http()[method](url).send({});
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('projects CRUD', () => {
    async function technology(name: string) {
      const res = await authed.post('/api/admin/technologies', { name }).expect(201);
      return res.body.data as { id: string; slug: string };
    }

    it('creates, reads, updates and deletes a project with its relations', async () => {
      const angular = await technology('Angular');
      const nest = await technology('NestJS');
      expect(angular.slug).toBe('angular');

      const created = await authed
        .post('/api/admin/projects', {
          title: 'Sistema de Gestión',
          shortDescription: 'Descripción corta',
          technologyIds: [angular.id, nest.id],
          responsibilities: ['Diseño de la base de datos', 'API REST'],
          images: [{ imageUrl: 'https://example.com/captura.png', altText: 'Pantalla principal' }],
          repositoryUrl: 'https://github.com/example/repo',
        })
        .expect(201);
      const project = created.body.data;
      expect(project.slug).toBe('sistema-de-gestion');
      expect(project.isPublished).toBe(false); // drafts by default
      expect(project.technologies.map((t: { name: string }) => t.name)).toEqual(['Angular', 'NestJS']);
      expect(project.responsibilities).toEqual(['Diseño de la base de datos', 'API REST']);

      const updated = await authed
        .patch(`/api/admin/projects/${project.id}`, {
          isPublished: true,
          technologyIds: [nest.id],
          responsibilities: [],
        })
        .expect(200);
      expect(updated.body.data.technologies.map((t: { name: string }) => t.name)).toEqual(['NestJS']);
      expect(updated.body.data.responsibilities).toEqual([]);
      expect(updated.body.data.images).toHaveLength(1); // untouched when not sent

      await ctx.http().get('/api/public/projects/sistema-de-gestion').expect(200);

      await authed.delete(`/api/admin/projects/${project.id}`).expect(204);
      await authed.get(`/api/admin/projects/${project.id}`).expect(404);
      expect(await ctx.prisma.projectTechnology.count()).toBe(0);
      expect(await ctx.prisma.technology.count()).toBe(2); // shared technologies survive
    });

    it('rolls back the whole operation when a relation is invalid', async () => {
      await authed
        .post('/api/admin/projects', {
          title: 'Inválido',
          shortDescription: 'x',
          technologyIds: ['0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0009'],
        })
        .expect(400);
      expect(await ctx.prisma.project.count()).toBe(0);
    });

    it('generates unique slugs and reports explicit duplicates as 409', async () => {
      await authed.post('/api/admin/projects', { title: 'Mi App', shortDescription: 'x' }).expect(201);
      const second = await authed.post('/api/admin/projects', { title: 'Mi App', shortDescription: 'x' }).expect(201);
      expect(second.body.data.slug).toBe('mi-app-2');
      const conflict = await authed
        .post('/api/admin/projects', { title: 'Otra', slug: 'mi-app', shortDescription: 'x' })
        .expect(409);
      expect(conflict.body.error.code).toBe('CONFLICT');
    });

    it('requires alt text for a cover image', async () => {
      await authed
        .post('/api/admin/projects', { title: 'P', shortDescription: 'x', coverImageUrl: 'https://example.com/c.png' })
        .expect(400);
    });

    it('paginates, searches and only sorts by whitelisted fields', async () => {
      for (const title of ['Alfa', 'Beta', 'Gamma']) {
        await authed.post('/api/admin/projects', { title, shortDescription: 'x' }).expect(201);
      }
      const page = await authed.get('/api/admin/projects?page=2&pageSize=2&sortBy=title&sortOrder=asc').expect(200);
      expect(page.body.meta).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
      expect(page.body.data.map((p: { title: string }) => p.title)).toEqual(['Gamma']);

      const search = await authed.get('/api/admin/projects?search=bet').expect(200);
      expect(search.body.data.map((p: { title: string }) => p.title)).toEqual(['Beta']);

      await authed.get('/api/admin/projects?sortBy=passwordHash').expect(400);
      await authed.get('/api/admin/projects?pageSize=1000').expect(400);
    });

    it('reorders atomically', async () => {
      const ids: string[] = [];
      for (const title of ['Uno', 'Dos', 'Tres']) {
        ids.push((await authed.post('/api/admin/projects', { title, shortDescription: 'x' }).expect(201)).body.data.id);
      }
      await authed.put('/api/admin/projects/order', { ids: [ids[2], ids[0], ids[1]] }).expect(204);
      const list = await authed.get('/api/admin/projects').expect(200);
      expect(list.body.data.map((p: { title: string }) => p.title)).toEqual(['Tres', 'Uno', 'Dos']);
      await authed
        .put('/api/admin/projects/order', { ids: [ids[0], '0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0009'] })
        .expect(400);
    });
  });

  describe('referential integrity', () => {
    it('refuses to delete a technology in use', async () => {
      const tech = (await authed.post('/api/admin/technologies', { name: 'Prisma' }).expect(201)).body.data;
      await authed
        .post('/api/admin/projects', { title: 'P', shortDescription: 'x', technologyIds: [tech.id] })
        .expect(201);
      const res = await authed.delete(`/api/admin/technologies/${tech.id}`).expect(409);
      expect(res.body.error.message).toMatch(/se usa en 1/);
    });

    it('refuses to delete a skill category that has skills', async () => {
      const category = (await authed.post('/api/admin/skill-categories', { name: 'Backend' }).expect(201)).body.data;
      const skill = (await authed.post('/api/admin/skills', { categoryId: category.id, name: 'NestJS' }).expect(201))
        .body.data;
      await authed.delete(`/api/admin/skill-categories/${category.id}`).expect(409);
      await authed.delete(`/api/admin/skills/${skill.id}`).expect(204);
      await authed.delete(`/api/admin/skill-categories/${category.id}`).expect(204);
    });
  });

  describe('experiences', () => {
    it('enforces the current / end date rules and replaces item lists', async () => {
      await authed
        .post('/api/admin/experiences', {
          company: 'A',
          position: 'B',
          startDate: '2026-02-01',
          isCurrent: true,
          endDate: '2026-03-01',
        })
        .expect(400);

      const created = await authed
        .post('/api/admin/experiences', {
          company: 'Canella',
          position: 'Analista Programador',
          startDate: '2026-02-01',
          isCurrent: true,
          responsibilities: ['Uno', 'Dos'],
          achievements: ['Logro'],
        })
        .expect(201);
      const experience = created.body.data;
      expect(experience).toMatchObject({ responsibilities: ['Uno', 'Dos'], achievements: ['Logro'], endDate: null });

      const updated = await authed
        .patch(`/api/admin/experiences/${experience.id}`, { responsibilities: ['Tres'] })
        .expect(200);
      expect(updated.body.data).toMatchObject({ responsibilities: ['Tres'], achievements: ['Logro'] });

      await authed.patch(`/api/admin/experiences/${experience.id}`, { isCurrent: false }).expect(400);
      const ended = await authed
        .patch(`/api/admin/experiences/${experience.id}`, { isCurrent: false, endDate: '2026-10-01' })
        .expect(200);
      expect(ended.body.data.endDate).toBe('2026-10-01T00:00:00.000Z');
    });

    it('rejects invalid ids with 400 and unknown ids with 404', async () => {
      await authed.get('/api/admin/experiences/not-a-uuid').expect(400);
      await authed.get('/api/admin/experiences/0b9d0f0e-6a1b-4c51-9a35-5f6d2f8a0009').expect(404);
    });
  });

  describe('profile and messages', () => {
    it('updates the profile and exposes private fields only to the admin', async () => {
      await authed
        .put('/api/admin/profile', {
          fullName: 'Nombre',
          professionalTitle: 'Título',
          shortBio: 'Bio',
          phone: '+502 1111-2222',
          isPhonePublic: false,
          publicEmail: 'publico@test.local',
        })
        .expect(200);
      expect((await authed.get('/api/admin/profile').expect(200)).body.data.phone).toBe('+502 1111-2222');
      expect((await ctx.http().get('/api/public/portfolio').expect(200)).body.data.profile.phone).toBeNull();
      await authed.put('/api/admin/profile', { fullName: '', professionalTitle: 'x', shortBio: 'x' }).expect(400);
    });

    it('lists, filters and updates contact messages', async () => {
      await ctx
        .http()
        .post('/api/public/contact')
        .send({ name: 'Ana', email: 'ana@example.com', subject: 'Hola', message: 'Mensaje de prueba.' })
        .expect(202);
      const list = await authed.get('/api/admin/contact-messages?status=NEW').expect(200);
      expect(list.body.meta.total).toBe(1);
      expect((await authed.get('/api/admin/contact-messages/unread-count').expect(200)).body.data.count).toBe(1);

      const id = list.body.data[0].id;
      const read = await authed.patch(`/api/admin/contact-messages/${id}`, { status: 'READ' }).expect(200);
      expect(read.body.data.readAt).not.toBeNull();
      await authed.delete(`/api/admin/contact-messages/${id}`).expect(204);
      expect(await ctx.prisma.contactMessage.count()).toBe(0);
    });
  });

  describe('media', () => {
    it('uploads a validated image and serves it', async () => {
      const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
      const res = await ctx
        .http()
        .post('/api/admin/media?kind=image')
        .set('Cookie', cookie)
        .attach('file', png, { filename: 'captura.png', contentType: 'image/png' })
        .expect(201);
      expect(res.body.data.url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
      await ctx
        .http()
        .get(res.body.data.url)
        .expect(200)
        .expect('Content-Type', /image\/png/);

      await ctx
        .http()
        .post('/api/admin/media?kind=image')
        .set('Cookie', cookie)
        .attach('file', Buffer.from('<svg></svg>'), { filename: 'x.png', contentType: 'image/png' })
        .expect(400);
    });
  });
});
