import { InternalServerErrorException } from '@nestjs/common';

export type SameSiteMode = 'lax' | 'strict' | 'none';

export type AuthConfig = {
  accessSecret: string;
  refreshSecret: string;
  issuer: string;
  audience: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  refreshCookieName: string;
  cookieDomain?: string;
  cookieSameSite: SameSiteMode;
  secureCookies: boolean;
  bcryptCost: number;
  demoMode: boolean;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new InternalServerErrorException(`${name} is required`);
  }
  return value;
}

function numberEnv(name: string, fallback: number, min: number): number {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (!Number.isFinite(value) || value < min) {
    throw new InternalServerErrorException(`${name} must be >= ${min}`);
  }
  return value;
}

function secretEnv(name: string, devFallback: string): string {
  const value = process.env[name]?.trim();
  if (value) {
    if (process.env.NODE_ENV === 'production' && value.length < 32) {
      throw new InternalServerErrorException(
        `${name} must be at least 32 characters in production`,
      );
    }
    return value;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new InternalServerErrorException(`${name} is required in production`);
  }
  return devFallback;
}

export function getAuthConfig(): AuthConfig {
  const isProd = process.env.NODE_ENV === 'production';
  const demoMode = process.env.AUTH_DEMO_MODE === 'true';
  if (isProd && demoMode) {
    throw new InternalServerErrorException(
      'AUTH_DEMO_MODE must be disabled in production',
    );
  }
  return {
    accessSecret: secretEnv(
      'JWT_ACCESS_SECRET',
      'dev_access_secret_change_me_32_chars',
    ),
    refreshSecret: secretEnv(
      'JWT_REFRESH_SECRET',
      'dev_refresh_secret_change_me_32_chars',
    ),
    issuer: isProd
      ? required('JWT_ISSUER')
      : (process.env.JWT_ISSUER ?? 'ejoy'),
    audience: isProd
      ? required('JWT_AUDIENCE')
      : (process.env.JWT_AUDIENCE ?? 'ejoy-apps'),
    accessTokenTtlSeconds: numberEnv('ACCESS_TOKEN_TTL_SECONDS', 15 * 60, 60),
    refreshTokenTtlSeconds: numberEnv(
      'REFRESH_TOKEN_TTL_SECONDS',
      14 * 24 * 60 * 60,
      60 * 60,
    ),
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'ejoy_refresh',
    cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
    cookieSameSite: (process.env.COOKIE_SAME_SITE?.trim().toLowerCase() ||
      'lax') as SameSiteMode,
    secureCookies: isProd || process.env.COOKIE_SECURE === 'true',
    bcryptCost: numberEnv('BCRYPT_COST', isProd ? 12 : 10, 10),
    demoMode,
  };
}
