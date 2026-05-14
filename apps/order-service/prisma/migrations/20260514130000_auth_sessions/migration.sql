CREATE TYPE "AuthSubjectType" AS ENUM ('STAFF', 'PLATFORM_ADMIN');

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "subjectType" "AuthSubjectType" NOT NULL,
  "subjectId" TEXT NOT NULL,
  "tokenFamily" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "userAgent" TEXT,
  "ipHash" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "rotatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthSession_subjectType_subjectId_idx" ON "AuthSession"("subjectType", "subjectId");
CREATE INDEX "AuthSession_tokenFamily_idx" ON "AuthSession"("tokenFamily");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE INDEX "AuthSession_revokedAt_idx" ON "AuthSession"("revokedAt");
