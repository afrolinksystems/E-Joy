import { OrderState } from './order.types';

const allowedTransitions: Record<OrderState, OrderState[]> = {
  [OrderState.DRAFT]: [OrderState.PENDING_PAYMENT, OrderState.CANCELLED],
  [OrderState.PENDING_PAYMENT]: [
    OrderState.PAID,
    OrderState.PAYMENT_FAILED,
    OrderState.CANCELLED,
  ],
  [OrderState.PAID]: [OrderState.PREPARING, OrderState.REFUND_PENDING],
  [OrderState.PREPARING]: [OrderState.READY, OrderState.REFUND_PENDING],
  [OrderState.READY]: [OrderState.COMPLETED, OrderState.REFUND_PENDING],
  [OrderState.COMPLETED]: [],
  [OrderState.CANCELLED]: [],
  [OrderState.REFUND_PENDING]: [OrderState.REFUNDED],
  [OrderState.REFUNDED]: [],
  [OrderState.PAYMENT_FAILED]: [],
};

export function canTransit(from: OrderState, to: OrderState): boolean {
  return allowedTransitions[from].includes(to);
}
