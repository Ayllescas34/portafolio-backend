import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { useTestEnvironment } from './test-env';

/** Recreates the test schema from the migrations (proves they work from empty). */
export default function globalSetup(): void {
  useTestEnvironment();
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
}
