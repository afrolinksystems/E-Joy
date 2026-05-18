import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AppLoggerService } from '../ops/app-logger.service';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly appLogger: AppLoggerService) {}

  consume(input: {
    key: string;
    limit: number;
    windowMs: number;
    label: string;
  }): void {
    const now = Date.now();
    const key = createHash('sha256')
      .update(`${input.label}:${input.key}`)
      .digest('hex');
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + input.windowMs });
      return;
    }
    current.count += 1;
    if (current.count > input.limit) {
      this.appLogger.warn('rate_limit.blocked', {
        label: input.label,
        limit: input.limit,
        windowMs: input.windowMs,
      });
      throw new HttpException(
        'Too many requests. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  getClientIp(req?: {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
  }): string {
    const raw = req?.headers?.['x-forwarded-for'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value?.split(',')[0]?.trim() || req?.ip || 'unknown';
  }
}
