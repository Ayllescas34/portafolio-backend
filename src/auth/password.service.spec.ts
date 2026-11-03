import { assertPasswordPolicy } from '../admin-users/admin-users.service';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes with Argon2id and never stores the plain password', async () => {
    const hash = await service.hash('una-clave-segura-123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('una-clave-segura-123');
  });

  it('verifies the right password and rejects others', async () => {
    const hash = await service.hash('una-clave-segura-123');
    await expect(service.verify(hash, 'una-clave-segura-123')).resolves.toBe(true);
    await expect(service.verify(hash, 'otra-clave-123456')).resolves.toBe(false);
  });

  it('returns false (not an exception) for a malformed hash', async () => {
    await expect(service.verify('not-a-hash', 'x')).resolves.toBe(false);
  });

  it('dummy verification always fails', async () => {
    await expect(service.verifyAgainstDummy('anything')).resolves.toBe(false);
  });
});

describe('password policy', () => {
  it('requires 12+ characters mixing letters and numbers', () => {
    expect(() => assertPasswordPolicy('corta1')).toThrow();
    expect(() => assertPasswordPolicy('solamenteletras')).toThrow();
    expect(() => assertPasswordPolicy('123456789012345')).toThrow();
    expect(() => assertPasswordPolicy('clave-larga-2026')).not.toThrow();
  });
});
