import { AppLoggerService } from './app-logger.service';

describe('AppLoggerService', () => {
  it('redacts sensitive keys and JWT-looking values', () => {
    const logger = new AppLoggerService();
    const redacted = logger.redact({
      phone: '0911000000',
      password: 'secret',
      headers: {
        authorization: 'Bearer abc.def.ghi',
        cookie: 'ejoy_refresh=token',
      },
      nested: {
        accessToken: 'abc.def.ghi',
        note: 'safe',
      },
    }) as Record<string, unknown>;

    expect(redacted.phone).toBe('0911000000');
    expect(redacted.password).toBe('[REDACTED]');
    expect((redacted.headers as Record<string, unknown>).authorization).toBe(
      '[REDACTED]',
    );
    expect((redacted.headers as Record<string, unknown>).cookie).toBe(
      '[REDACTED]',
    );
    expect((redacted.nested as Record<string, unknown>).accessToken).toBe(
      '[REDACTED]',
    );
    expect((redacted.nested as Record<string, unknown>).note).toBe('safe');
  });
});
