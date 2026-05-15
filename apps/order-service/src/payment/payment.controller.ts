import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrderService } from '../order/order.service';
import { AppLoggerService } from '../ops/app-logger.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly appLogger: AppLoggerService,
  ) {}

  /**
   * Telebirr server-to-server notify (REST, outside GraphQL).
   * Success response body must acknowledge receipt per provider contract.
   */
  @Post('telebirr/webhook')
  @HttpCode(200)
  async telebirrWebhook(
    @Body() body: unknown,
  ): Promise<{ code: string; msg: string }> {
    try {
      await this.orderService.handleTelebirrWebhook(body);
      this.appLogger.info('payment.callback.success', {
        provider: 'telebirr',
      });
      return { code: '0', msg: 'success' };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`telebirrWebhook: ${message}`);
      this.appLogger.warn('payment.callback.failed', {
        provider: 'telebirr',
        reason: message,
      });
      return { code: '1', msg: message };
    }
  }

  /**
   * Local sandbox redirect used by customer-web while the real Telebirr SDK is not wired.
   */
  @Get('telebirr/mock-callback')
  async telebirrMockCallback(
    @Query('orderId') orderId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).send('Not found');
      return;
    }
    const result = await this.orderService.applyMockPaymentSuccess(orderId);
    const customerOrigin =
      process.env.CUSTOMER_WEB_ORIGIN?.replace(/\/$/, '') ??
      'http://localhost:9601';
    const successUrl =
      process.env.MOCK_PAYMENT_SUCCESS_URL ?? `${customerOrigin}/order-success`;
    const failureUrl =
      process.env.MOCK_PAYMENT_FAILURE_URL ?? `${customerOrigin}/order-failed`;
    const target = result.ok
      ? successUrl
      : `${failureUrl}?reason=${encodeURIComponent(result.error ?? 'payment_failed')}`;
    res.redirect(target);
  }
}
