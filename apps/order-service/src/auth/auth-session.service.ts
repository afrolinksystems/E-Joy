import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { getAuthConfig } from './auth-config';
import { AppLoggerService } from '../ops/app-logger.service';

export type AuthSubjectType = 'STAFF' | 'PLATFORM_ADMIN';

export type SessionActor = {
  id: string;
  role: string;
  shopId?: string;
  scope: string[];
  subjectType: AuthSubjectType;
  platformRole?: string;
};

export type AuthSessionRow = {
  id: string;
  subjectType: AuthSubjectType;
  subjectId: string;
  tokenFamily: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appLogger: AppLoggerService,
  ) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashIp(ip?: string): string | null {
    if (!ip) return null;
    return createHash('sha256').update(ip).digest('hex');
  }

  private safeEqualHex(a: string, b: string): boolean {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  }

  buildRefreshToken(sessionId: string): string {
    return `${sessionId}.${randomUUID()}.${randomUUID()}`;
  }

  parseSessionId(refreshToken: string): string | undefined {
    const [sessionId] = refreshToken.split('.');
    return sessionId?.trim() || undefined;
  }

  async createSession(input: {
    subjectType: AuthSubjectType;
    subjectId: string;
    userAgent?: string;
    ip?: string;
  }): Promise<{ sessionId: string; refreshToken: string; expiresAt: Date }> {
    const cfg = getAuthConfig();
    const sessionId = randomUUID();
    const tokenFamily = randomUUID();
    const refreshToken = this.buildRefreshToken(sessionId);
    const expiresAt = new Date(Date.now() + cfg.refreshTokenTtlSeconds * 1000);
    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "AuthSession"
          ("id", "subjectType", "subjectId", "tokenFamily", "refreshTokenHash", "userAgent", "ipHash", "expiresAt", "updatedAt")
        VALUES
          (${sessionId}, ${input.subjectType}::"AuthSubjectType", ${input.subjectId}, ${tokenFamily}, ${this.hashToken(refreshToken)}, ${input.userAgent ?? null}, ${this.hashIp(input.ip)}, ${expiresAt}, CURRENT_TIMESTAMP)
      `,
    );
    this.logger.log(
      `auth_session_created subject=${input.subjectType}:${input.subjectId}`,
    );
    this.appLogger.info('auth.session.created', {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      sessionId,
    });
    return { sessionId, refreshToken, expiresAt };
  }

  async findSession(sessionId: string): Promise<AuthSessionRow | null> {
    const rows = await this.prisma.$queryRaw<AuthSessionRow[]>(
      Prisma.sql`
        SELECT "id", "subjectType", "subjectId", "tokenFamily", "refreshTokenHash", "expiresAt", "revokedAt"
        FROM "AuthSession"
        WHERE "id" = ${sessionId}
        LIMIT 1
      `,
    );
    return rows[0] ?? null;
  }

  async requireLiveSession(sessionId: string): Promise<AuthSessionRow> {
    const session = await this.findSession(sessionId);
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    return session;
  }

  async rotateRefreshToken(refreshToken: string): Promise<{
    session: AuthSessionRow;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const sessionId = this.parseSessionId(refreshToken);
    if (!sessionId) {
      throw new UnauthorizedException('Invalid refresh session');
    }
    const session = await this.findSession(sessionId);
    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      session.revokedAt
    ) {
      throw new UnauthorizedException('Invalid refresh session');
    }
    const actualHash = this.hashToken(refreshToken);
    if (!this.safeEqualHex(actualHash, session.refreshTokenHash)) {
      await this.revokeFamily(session.tokenFamily, 'refresh_reuse_detected');
      this.logger.warn(`refresh_reuse_detected session=${session.id}`);
      this.appLogger.warn('auth.refresh.reuse_detected', {
        sessionId: session.id,
        subjectType: session.subjectType,
        subjectId: session.subjectId,
      });
      throw new UnauthorizedException('Invalid refresh session');
    }
    const nextRefreshToken = this.buildRefreshToken(session.id);
    const nextExpiresAt = new Date(
      Date.now() + getAuthConfig().refreshTokenTtlSeconds * 1000,
    );
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "AuthSession"
        SET "refreshTokenHash" = ${this.hashToken(nextRefreshToken)},
            "rotatedAt" = CURRENT_TIMESTAMP,
            "expiresAt" = ${nextExpiresAt},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${session.id} AND "revokedAt" IS NULL
      `,
    );
    return {
      session: { ...session, expiresAt: nextExpiresAt },
      refreshToken: nextRefreshToken,
      expiresAt: nextExpiresAt,
    };
  }

  async revokeSession(sessionId: string, reason: string): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "AuthSession"
        SET "revokedAt" = COALESCE("revokedAt", CURRENT_TIMESTAMP),
            "revokedReason" = ${reason},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${sessionId}
      `,
    );
    this.logger.log(
      `auth_session_revoked session=${sessionId} reason=${reason}`,
    );
    this.appLogger.info('auth.session.revoked', { sessionId, reason });
  }

  async revokeFamily(tokenFamily: string, reason: string): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "AuthSession"
        SET "revokedAt" = COALESCE("revokedAt", CURRENT_TIMESTAMP),
            "revokedReason" = ${reason},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "tokenFamily" = ${tokenFamily}
      `,
    );
  }

  async revokeSubject(
    subjectType: AuthSubjectType,
    subjectId: string,
    reason: string,
  ): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`
        UPDATE "AuthSession"
        SET "revokedAt" = COALESCE("revokedAt", CURRENT_TIMESTAMP),
            "revokedReason" = ${reason},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "subjectType" = ${subjectType}::"AuthSubjectType"
          AND "subjectId" = ${subjectId}
          AND "revokedAt" IS NULL
      `,
    );
  }
}
