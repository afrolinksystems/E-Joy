import { AppController } from './app.controller';

describe('AppController health', () => {
  it('returns a simple health payload', () => {
    const controller = new AppController(
      { getHello: () => 'Hello World!' } as never,
      {} as never,
      { dependencyHealth: jest.fn() } as never,
    );

    expect(controller.health()).toMatchObject({
      ok: true,
      service: 'order-service',
    });
  });

  it('reports dependency health status', async () => {
    const controller = new AppController(
      { getHello: () => 'Hello World!' } as never,
      {} as never,
      {
        dependencyHealth: jest
          .fn()
          .mockResolvedValue({ db: 'ok', redis: 'unknown', kafka: 'unknown' }),
      } as never,
    );

    await expect(controller.dependencyHealth()).resolves.toMatchObject({
      ok: true,
      dependencies: { db: 'ok' },
    });
  });
});
