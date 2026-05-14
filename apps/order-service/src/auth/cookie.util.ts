import type { Response } from 'express';
import { getAuthConfig } from './auth-config';

type CookieRequest = {
  headers?: Record<string, string | string[] | undefined>;
};

function encodeCookieValue(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function readCookie(req: CookieRequest | undefined, name: string) {
  const raw = req?.headers?.cookie;
  const cookieHeader = Array.isArray(raw) ? raw.join(';') : raw;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

export function setRefreshCookie(res: Response | undefined, value: string) {
  if (!res) return;
  const cfg = getAuthConfig();
  const parts = [
    `${cfg.refreshCookieName}=${encodeCookieValue(value)}`,
    'Path=/graphql',
    `Max-Age=${cfg.refreshTokenTtlSeconds}`,
    'HttpOnly',
    `SameSite=${cfg.cookieSameSite}`,
  ];
  if (cfg.secureCookies) parts.push('Secure');
  if (cfg.cookieDomain) parts.push(`Domain=${cfg.cookieDomain}`);
  res.append('Set-Cookie', parts.join('; '));
}

export function clearRefreshCookie(res: Response | undefined) {
  if (!res) return;
  const cfg = getAuthConfig();
  const parts = [
    `${cfg.refreshCookieName}=`,
    'Path=/graphql',
    'Max-Age=0',
    'HttpOnly',
    `SameSite=${cfg.cookieSameSite}`,
  ];
  if (cfg.secureCookies) parts.push('Secure');
  if (cfg.cookieDomain) parts.push(`Domain=${cfg.cookieDomain}`);
  res.append('Set-Cookie', parts.join('; '));
}
