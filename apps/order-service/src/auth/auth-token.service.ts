import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { getAuthConfig } from './auth-config';
import type { AuthSubjectType, SessionActor } from './auth-session.service';

export type AccessTokenPayload = {
  sub: string;
  typ: 'access';
  sid: string;
  role: string;
  shopId?: string;
  scope: string[];
  subjectType: AuthSubjectType;
  platformRole?: string;
};

@Injectable()
export class AuthTokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(
    actor: SessionActor,
    sessionId: string,
  ): {
    accessToken: string;
    expiresAt: string;
  } {
    const cfg = getAuthConfig();
    const expiresAt = new Date(Date.now() + cfg.accessTokenTtlSeconds * 1000);
    const accessToken = this.jwtService.sign(
      {
        sub: actor.id,
        typ: 'access',
        sid: sessionId,
        role: actor.role,
        shopId: actor.shopId,
        scope: actor.scope,
        subjectType: actor.subjectType,
        platformRole: actor.platformRole,
        jti: randomUUID(),
      } satisfies AccessTokenPayload & { jti: string },
      {
        secret: cfg.accessSecret,
        issuer: cfg.issuer,
        audience: cfg.audience,
        expiresIn: cfg.accessTokenTtlSeconds,
        algorithm: 'HS256',
      },
    );
    return { accessToken, expiresAt: expiresAt.toISOString() };
  }

  assertAccessPayload(
    payload: Record<string, unknown>,
  ): asserts payload is AccessTokenPayload {
    if (
      payload.typ !== 'access' ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string' ||
      typeof payload.role !== 'string' ||
      (payload.subjectType !== 'STAFF' &&
        payload.subjectType !== 'PLATFORM_ADMIN') ||
      !Array.isArray(payload.scope)
    ) {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
