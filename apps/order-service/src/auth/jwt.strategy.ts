import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getAuthConfig } from './auth-config';
import { AuthSessionService } from './auth-session.service';
import {
  AuthTokenService,
  type AccessTokenPayload,
} from './auth-token.service';

type JwtPayload = {
  sub?: string;
  sid?: string;
  typ?: string;
  role?: string;
  shopId?: string;
  scope?: string[];
  subjectType?: 'STAFF' | 'PLATFORM_ADMIN';
  platformRole?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authSessions: AuthSessionService,
    private readonly authTokens: AuthTokenService,
  ) {
    const cfg = getAuthConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.accessSecret,
      issuer: cfg.issuer,
      audience: cfg.audience,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    role: string;
    shopId?: string;
    scope: string[];
    sessionId: string;
    subjectType: 'STAFF' | 'PLATFORM_ADMIN';
    platformRole?: string;
  }> {
    this.authTokens.assertAccessPayload(payload as Record<string, unknown>);
    const accessPayload = payload as AccessTokenPayload;
    const userId = accessPayload.sub;
    if (!userId || !accessPayload.sid) {
      throw new UnauthorizedException('JWT payload missing user id');
    }
    const session = await this.authSessions.requireLiveSession(
      accessPayload.sid,
    );
    if (
      session.subjectId !== userId ||
      session.subjectType !== accessPayload.subjectType
    ) {
      throw new UnauthorizedException('Session does not match access token');
    }
    return {
      id: userId,
      role: accessPayload.role,
      shopId: accessPayload.shopId,
      scope: accessPayload.scope,
      sessionId: accessPayload.sid,
      subjectType: accessPayload.subjectType,
      platformRole: accessPayload.platformRole,
    };
  }
}
