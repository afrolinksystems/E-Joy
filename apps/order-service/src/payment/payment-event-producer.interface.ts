export const PAYMENT_EVENT_PRODUCER = Symbol('PAYMENT_EVENT_PRODUCER');

export type PaymentEventName =
  | 'payment.initiated'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'print.alert'
  | 'order.status.updated';

export interface PaymentEventProducer {
  publish(
    eventName: PaymentEventName,
    payload: Record<string, unknown>,
  ): Promise<void>;
}
