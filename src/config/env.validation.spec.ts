import { durationToSeconds, NodeEnv, validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(48),
};

describe('validateEnv', () => {
  it('applies defaults for optional values', () => {
    const env = validateEnv(valid);
    expect(env).toMatchObject({
      NODE_ENV: NodeEnv.Development,
      PORT: 3000,
      JWT_EXPIRES_IN: '2h',
      COOKIE_SECURE: false,
      SWAGGER_ENABLED: true,
      RATE_LIMIT_ENABLED: true,
    });
  });

  it('parses booleans and numbers from strings', () => {
    const env = validateEnv({ ...valid, PORT: '3100', COOKIE_SECURE: 'true', SWAGGER_ENABLED: 'false' });
    expect(env.PORT).toBe(3100);
    expect(env.COOKIE_SECURE).toBe(true);
    expect(env.TRUST_PROXY_HOPS).toBe(0);
    expect(validateEnv({ ...valid, TRUST_PROXY_HOPS: '2' }).TRUST_PROXY_HOPS).toBe(2);
    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it('refuses to start with a short JWT secret', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('refuses a non PostgreSQL database URL', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: 'mysql://localhost/db' })).toThrow(/DATABASE_URL/);
  });

  it('refuses invalid booleans instead of guessing', () => {
    expect(() => validateEnv({ ...valid, COOKIE_SECURE: 'yes' })).toThrow(/COOKIE_SECURE/);
    expect(() => validateEnv({ ...valid, TRUST_PROXY_HOPS: '-1' })).toThrow(/TRUST_PROXY_HOPS/);
  });
});

describe('durationToSeconds', () => {
  it.each([
    ['45s', 45],
    ['30m', 1800],
    ['2h', 7200],
    ['7d', 604800],
  ])('%s -> %d', (input, expected) => {
    expect(durationToSeconds(input)).toBe(expected);
  });
});
