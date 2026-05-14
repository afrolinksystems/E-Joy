import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load apps/order-service/.env before Nest/Prisma (cwd-independent).
const envPath = [
  resolve(__dirname, '../../.env'), // dist/src/main.js
  resolve(__dirname, '../.env'), // src/main.ts (direct ts execution)
].find((p) => existsSync(p));
if (envPath) {
  loadEnv({ path: envPath });
}

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { getAuthConfig } from './auth/auth-config';
import { ObservabilityService } from './ops/observability.service';
import { SecurityValidationPipe } from './security/security-validation.pipe';
import { ensureUploadsDir, UPLOADS_ROOT } from './upload-path';

async function bootstrap() {
  getAuthConfig();
  ensureUploadsDir();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.useGlobalPipes(
    new SecurityValidationPipe(),
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: () => new BadRequestException('Invalid request input'),
    }),
  );
  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads/' });

  const configuredOrigins =
    process.env.CORS_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean) ?? [];
  if (process.env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
    throw new Error('CORS_ORIGINS is required in production');
  }
  app.enableCors({
    origin: [
      ...(process.env.NODE_ENV === 'production'
        ? []
        : [
            'http://localhost:5173',
            'http://localhost:9603',
            'http://localhost:9604',
            'http://localhost:9601',
            'http://localhost:9605',
          ]),
      ...configuredOrigins,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const observability = app.get(ObservabilityService);
  app.use((req: any, res: any, next: () => void) => {
    const started = Date.now();
    const requestId = (req.headers?.['x-request-id'] as string) ?? randomUUID();
    req.headers = { ...req.headers, 'x-request-id': requestId };
    const userId = req.user?.id ?? 'anonymous';
    const orderId =
      (req.body?.variables?.input?.orderId as string | undefined) ?? '-';
    res.on('finish', () => {
      const durationMs = Date.now() - started;
      observability.recordRequest({
        durationMs,
        statusCode: typeof res.statusCode === 'number' ? res.statusCode : 200,
        traceIdPresent: Boolean(requestId),
      });
      console.log(
        JSON.stringify({
          level: 'info',
          requestId,
          userId,
          orderId,
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          durationMs,
        }),
      );
    });
    next();
  });
  await app.listen(process.env.PORT ?? 9602);
}
void bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
