import { createHash } from 'node:crypto';
import type { CreateOrderInput } from '../order.inputs';
import { DeliveryType } from '../order.types';

export function resolveCreateOrderDeliveryTypeAndTableRef(
  input: CreateOrderInput,
): { tableRef: string; deliveryType: DeliveryType } {
  const tableRef = input.tableId?.trim() || input.tableNumber?.trim() || '';
  let deliveryType = input.deliveryType ?? DeliveryType.DINE_IN;
  if (tableRef) {
    deliveryType = DeliveryType.DINE_IN;
  }
  return { tableRef, deliveryType };
}

export function buildRequestHash(input: CreateOrderInput): string {
  const { deliveryType } = resolveCreateOrderDeliveryTypeAndTableRef(input);
  const normalized = {
    shopId: input.shopId,
    tableId: input.tableId ?? '',
    tableNumber: input.tableNumber ?? '',
    idempotencyKey: input.idempotencyKey,
    paymentMethod: input.paymentMethod,
    deliveryType,
    addressId: input.addressId ?? '',
    couponCode: input.couponCode ?? '',
    note: input.note ?? '',
    items: [...input.items]
      .map((item) => ({
        productId: item.productId,
        amount: item.amount,
        remark: item.remark ?? '',
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
  };
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}
