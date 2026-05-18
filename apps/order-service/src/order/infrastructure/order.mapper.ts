import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import {
  DeliveryType,
  MerchantDispatchOrderModel,
  MerchantOrderStatus,
  OrderModel,
  OrderState,
  PaymentState,
} from '../order.types';

export function initialMerchantStatus(state: OrderState): PrismaOrderStatus {
  switch (state) {
    case OrderState.PREPARING:
      return PrismaOrderStatus.PREPARING;
    case OrderState.COMPLETED:
      return PrismaOrderStatus.COMPLETED;
    case OrderState.CANCELLED:
      return PrismaOrderStatus.CANCELLED;
    default:
      return PrismaOrderStatus.PENDING;
  }
}

export function merchantStatusFromOrderState(state: string): PrismaOrderStatus {
  switch (state) {
    case 'PREPARING':
    case 'READY':
      return PrismaOrderStatus.PREPARING;
    case 'COMPLETED':
      return PrismaOrderStatus.COMPLETED;
    case 'CANCELLED':
    case 'REFUNDED':
      return PrismaOrderStatus.CANCELLED;
    case 'PAID':
      return PrismaOrderStatus.PENDING;
    default:
      return PrismaOrderStatus.PENDING;
  }
}

export function toMerchantDispatchOrder(o: {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: PrismaOrderStatus;
  state: string;
  createdAt: Date;
  acceptedAt: Date | null;
  completedAt: Date | null;
  shop: { name: string };
  table: { name: string } | null;
  items: Array<{
    quantity: number;
    productNameSnapshot: string;
    product: { name: string; imageUrl: string | null } | null;
  }>;
}): MerchantDispatchOrderModel {
  return {
    id: o.id,
    orderNo: o.orderNo,
    totalAmount: o.totalAmount,
    status: o.status as MerchantOrderStatus,
    orderState: o.state as OrderState,
    createdAt: o.createdAt.toISOString(),
    shopName: o.shop.name,
    tableName: o.table?.name ?? null,
    acceptedAt: o.acceptedAt?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null,
    items: o.items.map((item) => ({
      productName: item.product?.name ?? item.productNameSnapshot,
      quantity: item.quantity,
      imageUrl: item.product?.imageUrl ?? null,
    })),
  };
}

export function toOrderModel(order: {
  id: string;
  orderNo: string;
  state: string;
  paymentState: string;
  totalAmount: number;
  deliveryType?: string;
}): OrderModel {
  return {
    id: order.id,
    orderNo: order.orderNo,
    state: order.state as OrderState,
    paymentState: order.paymentState as PaymentState,
    totalAmount: order.totalAmount,
    deliveryType: (order.deliveryType ?? DeliveryType.DINE_IN) as DeliveryType,
  };
}
