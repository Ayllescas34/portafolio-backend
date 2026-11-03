import { BadRequestException, Injectable } from '@nestjs/common';
import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { ensureFound } from '../common/utils/ordering';

export const PASSWORD_MIN_LENGTH = 12;

export interface UpsertAdminInput {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  /** Creates the admin or resets its password (and revokes its sessions). */
  async upsert(input: UpsertAdminInput): Promise<{ id: string; created: boolean }> {
    assertPasswordPolicy(input.password);
    const email = input.email.trim().toLowerCase();
    const passwordHash = await this.passwords.hash(input.password);
    const existing = await this.prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
    const user = await this.prisma.adminUser.upsert({
      where: { email },
      create: { name: input.name.trim(), email, passwordHash },
      update: { name: input.name.trim(), passwordHash, isActive: true, tokenVersion: { increment: 1 } },
      select: { id: true },
    });
    return { id: user.id, created: !existing };
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = ensureFound(await this.prisma.adminUser.findUnique({ where: { id: adminId } }), 'Administrador');
    if (!(await this.passwords.verify(user.passwordHash, currentPassword))) {
      throw new BadRequestException({
        message: 'La contraseña actual no es correcta',
        details: [{ field: 'currentPassword', errors: ['no coincide'] }],
      });
    }
    assertPasswordPolicy(newPassword);
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash: await this.passwords.hash(newPassword), tokenVersion: { increment: 1 } },
    });
  }
}

export function assertPasswordPolicy(password: string): void {
  const problems: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) problems.push(`debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
  if (password.length > 128) problems.push('debe tener como máximo 128 caracteres');
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) problems.push('debe combinar letras y números');
  if (problems.length) {
    throw new BadRequestException({
      message: 'La contraseña no cumple la política de seguridad',
      details: [{ field: 'password', errors: problems }],
    });
  }
}
