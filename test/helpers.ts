import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../src/config/app-config.service';
import type { EnvironmentVariables } from '../src/config/env.validation';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { SESSION_COOKIE } from '../src/auth/auth.constants';
import { PasswordService } from '../src/auth/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

export const ADMIN = { name: 'Admin Test', email: 'admin@test.local', password: 'integration-pass-2026' };

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
}

/**
 * Boots the real application (same global pipeline as main.ts). The validated
 * configuration is cached when AppModule is imported, so per-suite settings
 * are applied by overriding AppConfigService instead of mutating process.env.
 */
export async function createTestApp(options: { rateLimit?: boolean } = {}): Promise<TestContext> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.rateLimit !== undefined) {
    const rateLimitEnabled = options.rateLimit;
    builder = builder.overrideProvider(AppConfigService).useFactory({
      factory: (config: ConfigService<EnvironmentVariables, true>) =>
        Object.defineProperty(new AppConfigService(config), 'rateLimitEnabled', { get: () => rateLimitEnabled }),
      inject: [ConfigService],
    });
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService), http: () => request(app.getHttpServer()) };
}

/** Empties every table (except Prisma's migration log) between tests. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function createAdmin(prisma: PrismaService, overrides: Partial<typeof ADMIN> = {}) {
  const data = { ...ADMIN, ...overrides };
  return prisma.adminUser.create({
    data: { name: data.name, email: data.email, passwordHash: await new PasswordService().hash(data.password) },
  });
}

/** Logs in and returns the Set-Cookie header value to reuse in requests. */
export async function login(ctx: TestContext, credentials = ADMIN): Promise<string> {
  const res = await ctx
    .http()
    .post('/api/auth/login')
    .send({ email: credentials.email, password: credentials.password })
    .expect(200);
  const cookie = ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) throw new Error('Login did not set the session cookie');
  return cookie.split(';')[0];
}

/** Minimal content required by the public endpoints. */
export async function seedSingletons(prisma: PrismaService): Promise<void> {
  await prisma.siteSettings.create({ data: { id: 1, siteTitle: 'Sitio', siteDescription: 'Descripción' } });
  await prisma.profile.create({
    data: {
      id: 1,
      fullName: 'Persona de Prueba',
      professionalTitle: 'Desarrollador',
      shortBio: 'Bio corta',
      publicEmail: 'publico@test.local',
      phone: '+502 0000-0000',
      isPhonePublic: false,
    },
  });
}
