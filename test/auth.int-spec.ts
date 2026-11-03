import { SESSION_COOKIE } from '../src/auth/auth.constants';
import { ADMIN, createAdmin, createTestApp, login, resetDatabase, TestContext } from './helpers';

describe('Auth (integration)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(() => ctx.app.close());
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await createAdmin(ctx.prisma);
  });

  it('sets an httpOnly, SameSite=Strict session cookie and never returns the hash', async () => {
    const res = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password })
      .expect(200);

    const cookie = ([] as string[]).concat(res.headers['set-cookie']).find((c) => c.startsWith(SESSION_COOKIE));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api/);
    expect(res.body.data.admin).toEqual({ id: expect.any(String), name: ADMIN.name, email: ADMIN.email });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|argon2/);
  });

  it('normalizes the email and records the last login', async () => {
    await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: '  ADMIN@Test.Local ', password: ADMIN.password })
      .expect(200);
    const user = await ctx.prisma.adminUser.findUniqueOrThrow({ where: { email: ADMIN.email } });
    expect(user.lastLoginAt).toBeInstanceOf(Date);
  });

  it('rejects wrong credentials with the same generic message', async () => {
    const wrongPassword = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'nope' })
      .expect(401);
    const unknownEmail = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: 'otro@test.local', password: ADMIN.password })
      .expect(401);
    expect(wrongPassword.body.error.message).toBe('Correo o contraseña incorrectos');
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it('validates the login payload', async () => {
    const res = await ctx.http().post('/api/auth/login').send({ email: 'no-es-correo' }).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field).sort()).toEqual(['email', 'password']);
  });

  it('returns the current admin only with a valid session', async () => {
    await ctx.http().get('/api/auth/me').expect(401);
    await ctx.http().get('/api/auth/me').set('Cookie', `${SESSION_COOKIE}=forged.token.value`).expect(401);
    const cookie = await login(ctx);
    const res = await ctx.http().get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(res.body.data.email).toBe(ADMIN.email);
  });

  it('logout clears the cookie and revokes the token server-side', async () => {
    const cookie = await login(ctx);
    const res = await ctx.http().post('/api/auth/logout').set('Cookie', cookie).expect(204);
    expect(([] as string[]).concat(res.headers['set-cookie']).join()).toMatch(new RegExp(`${SESSION_COOKIE}=;`));
    // The old token is rejected even if a client kept a copy.
    await ctx.http().get('/api/auth/me').set('Cookie', cookie).expect(401);
    await ctx.http().get('/api/admin/projects').set('Cookie', cookie).expect(401);
  });

  it('blocks inactive admins', async () => {
    await ctx.prisma.adminUser.update({ where: { email: ADMIN.email }, data: { isActive: false } });
    await ctx.http().post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password }).expect(401);
  });

  it('changing the password revokes existing sessions', async () => {
    const cookie = await login(ctx);
    await ctx
      .http()
      .patch('/api/admin/account/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'incorrecta-123', newPassword: 'nueva-clave-2026' })
      .expect(400);
    await ctx
      .http()
      .patch('/api/admin/account/password')
      .set('Cookie', cookie)
      .send({ currentPassword: ADMIN.password, newPassword: 'nueva-clave-2026' })
      .expect(204);
    await ctx.http().get('/api/auth/me').set('Cookie', cookie).expect(401);
    await login(ctx, { ...ADMIN, password: 'nueva-clave-2026' });
  });
});

describe('Rate limiting (integration)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    process.env.RATE_LIMIT_ENABLED = 'true';
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
  });
  afterAll(async () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    await ctx.app.close();
  });

  it('limits login attempts to 5 per minute', async () => {
    for (let i = 0; i < 5; i++) {
      await ctx.http().post('/api/auth/login').send({ email: 'x@test.local', password: 'bad' }).expect(401);
    }
    const res = await ctx.http().post('/api/auth/login').send({ email: 'x@test.local', password: 'bad' }).expect(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
