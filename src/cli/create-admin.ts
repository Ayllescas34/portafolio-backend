/**
 * Creates the local admin account, or resets its password.
 *
 *   npm run admin:create              interactive (password typed hidden)
 *   npm run admin:create -- --from-env  reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD
 *                                       (used by automated test setup only)
 *
 * Only an Argon2id hash is stored. The password is never printed or logged.
 */
import { NestFactory } from '@nestjs/core';
import { createInterface } from 'node:readline/promises';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ imports: [AppConfigModule, PrismaModule, AdminUsersModule] })
class CliModule {}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error('Se necesita una terminal interactiva para escribir la contraseña.'));
      return;
    }
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off('data', onData);
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          cleanup();
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          cleanup();
          reject(new Error('Cancelado.'));
          return;
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function readInput(): Promise<{ name: string; email: string; password: string }> {
  if (process.argv.includes('--from-env')) {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Faltan ADMIN_EMAIL o ADMIN_PASSWORD.');
    return { name: ADMIN_NAME ?? 'Administrador', email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const name = (await rl.question('Nombre del administrador: ')).trim() || 'Administrador';
  const email = (await rl.question('Correo de acceso: ')).trim();
  rl.close();
  const password = await askHidden('Contraseña (mín. 12 caracteres, letras y números): ');
  const confirm = await askHidden('Repite la contraseña: ');
  if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
  return { name, email, password };
}

async function main(): Promise<void> {
  const input = await readInput();
  const app = await NestFactory.createApplicationContext(CliModule, { logger: ['error'] });
  try {
    const result = await app.get(AdminUsersService).upsert(input);
    console.log(result.created ? 'Administrador creado.' : 'Contraseña restablecida y sesiones revocadas.');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  const response = (error as { response?: { details?: { errors: string[] }[] } }).response;
  const details = response?.details?.flatMap((d) => d.errors).join(', ');
  console.error(`No se pudo crear el administrador: ${details ?? (error as Error).message}`);
  process.exit(1);
});
