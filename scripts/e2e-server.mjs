// Starts an isolated API for the end-to-end suite:
//   - TEST database only (refuses anything not ending in "_test")
//   - schema rebuilt from the migrations + CV seed + a throwaway admin
//   - port 3100, CORS limited to the e2e frontend (4300)
// Admin credentials come from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD, generated
// per run by frontend/playwright.config.ts. Nothing is written to disk.
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL no está definida en backend/.env');
const dbName = new URL(url).pathname.slice(1);
if (!dbName.endsWith('_test')) throw new Error(`Las pruebas E2E solo usan bases *_test (recibida: ${dbName})`);
if (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD) {
  throw new Error('Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (las define playwright.config.ts)');
}

const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: url,
  PORT: '3100',
  CORS_ORIGINS: 'http://localhost:4300',
  SWAGGER_ENABLED: 'false',
  RATE_LIMIT_ENABLED: 'false',
  UPLOADS_DIR: mkdtempSync(join(tmpdir(), 'portfolio-e2e-')),
  ADMIN_NAME: 'Admin E2E',
  ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.E2E_ADMIN_PASSWORD,
};

const run = (command) => execSync(command, { cwd: root, env, stdio: 'inherit' });
run('npx prisma migrate reset --force --skip-generate'); // also runs the seed
run('npx ts-node src/cli/create-admin.ts --from-env');

const server = spawn(process.execPath, ['-r', 'ts-node/register/transpile-only', 'src/main.ts'], {
  cwd: root,
  env,
  stdio: 'inherit',
});
const stop = () => server.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
server.on('exit', (code) => process.exit(code ?? 0));
