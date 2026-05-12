import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentEventName,
  PaymentEventProducer,
} from './payment-event-producer.interface';

@Injectable()
export class NoopPaymentEventProducerService implements PaymentEventProducer {
  private readonly logger = new Logger(NoopPaymentEventProducerService.name);

  async publish(
    eventName: PaymentEventName,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // Placeholder for Kafka integration; keep audit trail in logs for now.
    this.logger.log(`payment-event ${eventName}: ${JSON.stringify(payload)}`);
  }
}
