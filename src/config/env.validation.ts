import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL debe ser una URL de PostgreSQL',
  })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET debe tener al menos 32 caracteres' })
  JWT_SECRET!: string;

  /** Session lifetime, e.g. "2h", "30m". */
  @Matches(/^\d+[smhd]$/, {
    message: 'JWT_EXPIRES_IN debe tener el formato <número><s|m|h|d>',
  })
  JWT_EXPIRES_IN = '2h';

  /** Comma separated list of allowed browser origins. */
  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS = 'http://localhost:4200';

  @IsBoolean()
  COOKIE_SECURE = false;

  @IsBoolean()
  SWAGGER_ENABLED = true;

  @IsBoolean()
  RATE_LIMIT_ENABLED = true;

  /** Reverse proxies in front of the API. Sets the real client IP for rate limiting. */
  @IsInt()
  @Min(0)
  @Max(5)
  TRUST_PROXY_HOPS = 0;

  @IsString()
  @IsNotEmpty()
  UPLOADS_DIR = 'uploads';
}

// Returns `unknown`: an unparseable value is passed through so validation reports it.
function toBoolean(value: unknown, fallback: boolean): unknown {
  if (value === undefined || value === '') return fallback;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value; // left as-is so validation reports it
}

function toInt(value: unknown, fallback: number): unknown {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : value;
}

/**
 * Validates process.env at startup. The application refuses to boot with an
 * invalid configuration instead of failing later at runtime.
 */
export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const defaults = new EnvironmentVariables();
  // Raw values are assigned untyped on purpose; validateSync checks every one of them.
  const env = new EnvironmentVariables();
  Object.assign(env, {
    NODE_ENV: raw.NODE_ENV ?? defaults.NODE_ENV,
    PORT: toInt(raw.PORT, defaults.PORT),
    DATABASE_URL: raw.DATABASE_URL,
    JWT_SECRET: raw.JWT_SECRET,
    JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN ?? defaults.JWT_EXPIRES_IN,
    CORS_ORIGINS: raw.CORS_ORIGINS ?? defaults.CORS_ORIGINS,
    COOKIE_SECURE: toBoolean(raw.COOKIE_SECURE, defaults.COOKIE_SECURE),
    SWAGGER_ENABLED: toBoolean(raw.SWAGGER_ENABLED, defaults.SWAGGER_ENABLED),
    RATE_LIMIT_ENABLED: toBoolean(raw.RATE_LIMIT_ENABLED, defaults.RATE_LIMIT_ENABLED),
    TRUST_PROXY_HOPS: toInt(raw.TRUST_PROXY_HOPS, defaults.TRUST_PROXY_HOPS),
    UPLOADS_DIR: raw.UPLOADS_DIR ?? defaults.UPLOADS_DIR,
  });

  const errors = validateSync(env);
  if (errors.length > 0) {
    const lines = errors.map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`);
    throw new Error(`Configuración de entorno inválida:\n${lines.join('\n')}`);
  }
  return env;
}

/** Converts "2h" / "30m" / "45s" / "7d" to seconds. */
export function durationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new Error(`Duración inválida: ${duration}`);
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return Number(match[1]) * factor;
}
