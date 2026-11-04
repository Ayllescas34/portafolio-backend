import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isAbsolute, resolve } from 'node:path';
import { durationToSeconds, EnvironmentVariables, NodeEnv } from './env.validation';

/** Typed, read-only access to the validated configuration. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  get isProduction(): boolean {
    return this.config.get('NODE_ENV', { infer: true }) === NodeEnv.Production;
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true });
  }

  get sessionTtlSeconds(): number {
    return durationToSeconds(this.config.get('JWT_EXPIRES_IN', { infer: true }));
  }

  get corsOrigins(): string[] {
    return this.config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get cookieSecure(): boolean {
    return this.config.get('COOKIE_SECURE', { infer: true });
  }

  get swaggerEnabled(): boolean {
    return this.config.get('SWAGGER_ENABLED', { infer: true });
  }

  get rateLimitEnabled(): boolean {
    return this.config.get('RATE_LIMIT_ENABLED', { infer: true });
  }

  get trustProxyHops(): number {
    return this.config.get('TRUST_PROXY_HOPS', { infer: true });
  }

  get uploadsDir(): string {
    const dir = this.config.get('UPLOADS_DIR', { infer: true });
    return isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
  }
}
