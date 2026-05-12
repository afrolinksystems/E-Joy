import { Inject, Injectable } from '@nestjs/common';
import { Socket } from 'node:net';
import { PRISMA_CLIENT } from '../prisma/prisma.token';
import { PaymentMetricsService } from '../payment/payment-metrics.service';
import { ObservabilityService } from './observability.service';
import {
  AlertStatusModel,
  DependencyHealthModel,
  ObservabilityMetricsModel,
  PaymentMetricsModel,
} from './ops.types';

@Injectable()
export class OpsService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: {
      order: { count: (args?: unknown) => Promise<number> };
    },
    private readonly paymentMetricsService: PaymentMetricsService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async dependencyHealth(): Promise<DependencyHealthModel> {
    const db = await this.checkDb();
    const redis = await this.checkTcpFromUrl(process.env.REDIS_URL, 6379);
    const kafka = await this.checkTcpFromBrokers(process.env.KAFKA_BROKERS);
    return { db, redis, kafka };
  }

  paymentMetrics(): PaymentMetricsModel {
    return this.paymentMetricsService.snapshot();
  }

  observabilityMetrics(): ObservabilityMetricsModel {
    return this.observabilityService.snapshot();
  }

  alertStatus(): AlertStatusModel {
    return this.observabilityService.alertStatus();
  }

  private async checkDb(): Promise<string> {
    try {
      await this.prisma.order.count({ take: 1 });
      return 'ok';
    } catch {
      return 'down';
    }
  }

  private async checkTcpFromUrl(
    url: string | undefined,
    fallbackPort: number,
  ): Promise<string> {
    if (!url) return 'unknown';
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const port = Number(parsed.port || fallbackPort);
      return await this.checkTcp(host, port);
    } catch {
      return 'unknown';
    }
  }

  private async checkTcpFromBrokers(
    brokers: string | undefined,
  ): Promise<string> {
    if (!brokers) return 'unknown';
    const first = brokers.split(',')[0]?.trim();
    if (!first) return 'unknown';
    const [host, portText] = first.split(':');
    return this.checkTcp(host, Number(portText || 9092));
  }

  private async checkTcp(host: string, port: number): Promise<string> {
    return new Promise((resolve) => {
      const socket = new Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve('down');
      }, 1500);
      socket.connect(port, host, () => {
        clearTimeout(timeout);
        socket.end();
        resolve('ok');
      });
      socket.on('error', () => {
        clearTimeout(timeout);
        resolve('down');
      });
    });
  }
}
