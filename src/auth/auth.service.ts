import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedAdmin } from './decorators';
import { PasswordService } from './password.service';

interface SessionPayload {
  sub: string;
  ver: number;
}

export interface IssuedSession {
  admin: AuthenticatedAdmin;
  token: string;
  expiresAt: Date;
}

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos';
const INVALID_SESSION = 'La sesión expiró o no es válida';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
    private readonly config: AppConfigService,
  ) {}

  async login(email: string, password: string): Promise<IssuedSession> {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    const valid = user
      ? await this.passwords.verify(user.passwordHash, password)
      : await this.passwords.verifyAgainstDummy(password);

    if (!user || !valid || !user.isActive) {
      // Same message for every case so the response does not reveal which part failed.
      this.logger.warn('Intento de inicio de sesión rechazado');
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    this.logger.log(`Sesión iniciada por administrador ${user.id}`);
    return this.issue({ id: user.id, name: user.name, email: user.email }, user.tokenVersion);
  }

  async validateSession(token: string): Promise<AuthenticatedAdmin> {
    let payload: SessionPayload;
    try {
      payload = await this.jwt.verifyAsync<SessionPayload>(token);
    } catch {
      throw new UnauthorizedException(INVALID_SESSION);
    }
    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, isActive: true, tokenVersion: true },
    });
    if (!user || !user.isActive || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException(INVALID_SESSION);
    }
    return { id: user.id, name: user.name, email: user.email };
  }

  /** Revokes every session of this admin (stateless JWTs become stale). */
  async revokeSessions(adminId: string): Promise<void> {
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  private async issue(admin: AuthenticatedAdmin, version: number): Promise<IssuedSession> {
    const ttl = this.config.sessionTtlSeconds;
    const token = await this.jwt.signAsync({ sub: admin.id, ver: version } satisfies SessionPayload, {
      expiresIn: ttl,
    });
    return { admin, token, expiresAt: new Date(Date.now() + ttl * 1000) };
  }
}
