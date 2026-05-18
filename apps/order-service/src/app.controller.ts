import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { OrderService } from './order/order.service';
import { OpsService } from './ops/ops.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly orderService: OrderService,
    private readonly opsService: OpsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return {
      ok: true,
      service: process.env.SERVICE_NAME?.trim() || 'order-service',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Get('health/dependencies')
  async dependencyHealth() {
    const dependencies = await this.opsService.dependencyHealth();
    return {
      ok: dependencies.db === 'ok',
      service: process.env.SERVICE_NAME?.trim() || 'order-service',
      dependencies,
    };
  }

  /**
   * Telebirr sandbox browser redirect (must live on a route that Nest actually registers).
   * See `PaymentController` POST webhook; this GET was previously on `PaymentController` but did not bind in practice.
   */
  @Get('payment/telebirr/mock-callback')
  async mockTelebirrCallback(
    @Query('orderId') orderId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).send('Not found');
      return;
    }
    const trimmed = orderId?.trim() ?? '';
    const result = await this.orderService.applyMockPaymentSuccess(trimmed);
    if (!result.ok) {
      this.logger.warn(
        `mockTelebirrCallback: ${result.error ?? 'unknown'} (orderId=${trimmed})`,
      );
    }
    const redirectUrl =
      process.env.MOCK_PAYMENT_SUCCESS_URL ??
      'http://localhost:9601/order-success';
    res.redirect(302, redirectUrl);
  }
}
