import type { Product } from '@prisma/client';
import type { CreateOrderInput } from '../order.inputs';

export type OrderItemRow = {
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
  remark?: string;
};

export function buildServerAuthoritativeLineItems(
  orderLines: CreateOrderInput['items'],
  productsById: Map<string, Product>,
): { itemRows: OrderItemRow[]; subtotalAmount: number } {
  let subtotalAmount = 0;
  const itemRows = orderLines.map((line) => {
    const product = productsById.get(line.productId)!;
    const subtotal = product.unitPrice * line.amount;
    subtotalAmount += subtotal;
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      unitPriceSnapshot: product.unitPrice,
      quantity: line.amount,
      subtotal,
      remark: line.remark,
    };
  });
  return { itemRows, subtotalAmount };
}
