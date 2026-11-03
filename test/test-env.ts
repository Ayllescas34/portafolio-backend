import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * Points the process at the TEST database. Refuses to continue unless the
 * database name ends in "_test", because the suites wipe it.
 */
export function useTestEnvironment(): string {
  const envFile = resolve(__dirname, '..', '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL no está definida (ver backend/.env.example).');
  const dbName = new URL(url).pathname.replace(/^\//, '');
  if (!dbName.endsWith('_test')) {
    throw new Error(`Por seguridad, las pruebas solo se ejecutan contra una base *_test (recibida: "${dbName}").`);
  }

  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: url,
    JWT_SECRET: process.env.JWT_SECRET ?? 'integration-tests-secret-integration-tests-secret',
    SWAGGER_ENABLED: 'false',
    RATE_LIMIT_ENABLED: 'false',
    COOKIE_SECURE: 'false',
    UPLOADS_DIR: join(tmpdir(), 'portfolio-test-uploads'),
  });
  return url;
}
