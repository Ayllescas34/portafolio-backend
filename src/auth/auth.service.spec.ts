import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUser } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

const admin: AdminUser = {
  id: '6f1b6a8e-1d1a-4d5e-9b9a-000000000001',
  name: 'Admin',
  email: 'admin@example.com',
  passwordHash: 'hash',
  isActive: true,
  tokenVersion: 3,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let prisma: { adminUser: { findUnique: jest.Mock; update: jest.Mock } };
  let passwords: { verify: jest.Mock; verifyAgainstDummy: jest.Mock };
  let service: AuthService;
  const jwt = new JwtService({ secret: 'unit-test-secret-unit-test-secret-1234' });

  beforeEach(() => {
    prisma = { adminUser: { findUnique: jest.fn(), update: jest.fn() } };
    passwords = { verify: jest.fn(), verifyAgainstDummy: jest.fn().mockResolvedValue(false) };
    const config = { sessionTtlSeconds: 3600 } as AppConfigService;
    service = new AuthService(prisma as unknown as PrismaService, jwt, passwords as unknown as PasswordService, config);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  describe('login', () => {
    it('issues a token carrying the current token version', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(admin);
      passwords.verify.mockResolvedValue(true);

      const session = await service.login(admin.email, 'correct-password-1');

      expect(session.admin).toEqual({ id: admin.id, name: admin.name, email: admin.email });
      expect(session.admin).not.toHaveProperty('passwordHash');
      const payload = await jwt.verifyAsync<{ sub: string; ver: number }>(session.token);
      expect(payload).toMatchObject({ sub: admin.id, ver: 3 });
      expect(prisma.adminUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { lastLoginAt: expect.any(Date) } }),
      );
    });

    it('rejects a wrong password with a generic message', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(admin);
      passwords.verify.mockResolvedValue(false);
      await expect(service.login(admin.email, 'bad')).rejects.toThrow('Correo o contraseña incorrectos');
    });

    it('spends equivalent work when the email does not exist', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null);
      await expect(service.login('nobody@example.com', 'x')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(passwords.verifyAgainstDummy).toHaveBeenCalled();
    });

    it('rejects inactive accounts even with the right password', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...admin, isActive: false });
      passwords.verify.mockResolvedValue(true);
      await expect(service.login(admin.email, 'correct-password-1')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('validateSession', () => {
    it('accepts a token whose version matches the database', async () => {
      const token = await jwt.signAsync({ sub: admin.id, ver: 3 });
      prisma.adminUser.findUnique.mockResolvedValue(admin);
      await expect(service.validateSession(token)).resolves.toEqual({
        id: admin.id,
        name: admin.name,
        email: admin.email,
      });
    });

    it('rejects tokens revoked by logout (stale version)', async () => {
      const token = await jwt.signAsync({ sub: admin.id, ver: 2 });
      prisma.adminUser.findUnique.mockResolvedValue(admin);
      await expect(service.validateSession(token)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects tampered or foreign tokens', async () => {
      const foreign = await new JwtService({ secret: 'another-secret-another-secret-12345' }).signAsync({
        sub: admin.id,
        ver: 3,
      });
      await expect(service.validateSession(foreign)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(service.validateSession('not-a-jwt')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  it('revokeSessions increments the token version', async () => {
    await service.revokeSessions(admin.id);
    expect(prisma.adminUser.update).toHaveBeenCalledWith({
      where: { id: admin.id },
      data: { tokenVersion: { increment: 1 } },
    });
  });
});
