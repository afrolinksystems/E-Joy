import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogEvent = {
  level: LogLevel;
  event: string;
  message?: string;
  timestamp: string;
  service: string;
  environment: string;
  [key: string]: unknown;
};

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|cookie|authorization|signature|privatekey|publickey|apikey|api_key|refresh|access|rawpayload|file|buffer)/i;

@Injectable()
export class AppLoggerService implements OnModuleDestroy {
  private readonly logger = new Logger(AppLoggerService.name);
  private readonly buffer: LogEvent[] = [];
  private readonly timer: NodeJS.Timeout | undefined;

  constructor() {
    if (this.shouldSendToBetterStack()) {
      this.timer = setInterval(() => {
        void this.flush();
      }, 5000);
      this.timer.unref?.();
    }
  }

  debug(event: string, data?: Record<string, unknown>, message?: string): void {
    this.write('debug', event, data, message);
  }

  info(event: string, data?: Record<string, unknown>, message?: string): void {
    this.write('info', event, data, message);
  }

  warn(event: string, data?: Record<string, unknown>, message?: string): void {
    this.write('warn', event, data, message);
  }

  error(event: string, data?: Record<string, unknown>, message?: string): void {
    this.write('error', event, data, message);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.flush();
  }

  redact(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
      if (this.looksLikeJwt(value) || value.length > 2000) return '[REDACTED]';
      return value;
    }
    if (typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? '[REDACTED]'
        : this.redact(entry);
    }
    return out;
  }

  private write(
    level: LogLevel,
    event: string,
    data?: Record<string, unknown>,
    message?: string,
  ): void {
    if (!this.shouldLog(level)) return;
    const payload: LogEvent = {
      level,
      event,
      message,
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME?.trim() || 'order-service',
      environment: process.env.NODE_ENV || 'development',
      ...((this.redact(data ?? {}) as Record<string, unknown>) ?? {}),
    };
    console[level === 'debug' ? 'log' : level](JSON.stringify(payload));
    if (this.shouldSendToBetterStack()) {
      this.buffer.push(payload);
      if (this.buffer.length >= 10) void this.flush();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configured =
      (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
    return order.indexOf(level) >= order.indexOf(configured);
  }

  private shouldSendToBetterStack(): boolean {
    return (
      process.env.LOG_TO_BETTER_STACK === 'true' &&
      Boolean(process.env.BETTER_STACK_SOURCE_TOKEN?.trim())
    );
  }

  private async flush(): Promise<void> {
    if (!this.shouldSendToBetterStack() || this.buffer.length === 0) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      const ingestUrl =
        process.env.BETTER_STACK_INGEST_URL?.trim() ||
        'https://in.logs.betterstack.com';
      const response = await fetch(ingestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.BETTER_STACK_SOURCE_TOKEN}`,
          'Content-Type': 'application/x-ndjson',
        },
        body: batch.map((entry) => JSON.stringify(entry)).join('\n'),
      });
      if (!response.ok) {
        this.logger.warn(`Better Stack log ingest failed: ${response.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Better Stack log ingest failed: ${message}`);
    }
  }

  private looksLikeJwt(value: string): boolean {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
  }
}
