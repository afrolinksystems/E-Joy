import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum OrderState {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum PaymentMethod {
  TELEBIRR = 'TELEBIRR',
  CASH = 'CASH',
}

export enum PaymentChannel {
  TELEBIRR_APP = 'TELEBIRR_APP',
  TELEBIRR_H5 = 'TELEBIRR_H5',
}

export enum PaymentState {
  NOT_REQUIRED = 'NOT_REQUIRED',
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum DeliveryType {
  DINE_IN = 'DINE_IN',
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum DeliveryFeeType {
  FIXED = 'FIXED',
  DISTANCE_BASED = 'DISTANCE_BASED',
}

export enum DeliveryAcceptMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

registerEnumType(OrderState, { name: 'OrderState' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
registerEnumType(PaymentChannel, { name: 'PaymentChannel' });
registerEnumType(PaymentState, { name: 'PaymentState' });
registerEnumType(DeliveryType, { name: 'DeliveryType' });
registerEnumType(DeliveryFeeType, { name: 'DeliveryFeeType' });
registerEnumType(DeliveryAcceptMode, { name: 'DeliveryAcceptMode' });

/** Merchant dispatch board status (mirrors Prisma `Order.status`) */
export enum MerchantOrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(MerchantOrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class OrderError {
  @Field()
  code!: string;

  @Field()
  message!: string;
}

/** 顾客端门店菜单（公开查询，仅上架商品，单价为整数分） */
@ObjectType()
export class ShopMenuProductModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  category!: string;

  @Field(() => Int)
  unitPrice!: number;

  @Field(() => String, { nullable: true })
  imageUrl?: string;
}

@ObjectType()
export class OrderModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  orderNo!: string;

  @Field(() => OrderState)
  state!: OrderState;

  @Field(() => PaymentState)
  paymentState!: PaymentState;

  @Field(() => Int)
  totalAmount!: number;

  @Field(() => DeliveryType)
  deliveryType!: DeliveryType;
}

@ObjectType()
export class PaymentAttemptModel {
  @Field(() => ID)
  id!: string;

  @Field(() => PaymentChannel)
  channel!: PaymentChannel;

  @Field(() => PaymentState)
  state!: PaymentState;
}

@ObjectType()
export class OrderPayload {
  @Field()
  ok!: boolean;

  @Field(() => OrderModel, { nullable: true })
  order?: OrderModel;

  @Field(() => OrderError, { nullable: true })
  error?: OrderError;
}

@ObjectType()
export class PaymentPayload {
  @Field()
  ok!: boolean;

  @Field(() => PaymentAttemptModel, { nullable: true })
  payment?: PaymentAttemptModel;

  @Field({ nullable: true })
  rawRequest?: string;

  /** Telebirr H5 checkout URL when channel is TELEBIRR_H5 */
  @Field({ nullable: true })
  toPayUrl?: string;

  @Field(() => OrderError, { nullable: true })
  error?: OrderError;
}

@ObjectType()
export class CouponPreviewModel {
  @Field()
  couponCode!: string;

  @Field(() => Int)
  discountAmount!: number;

  @Field(() => Int)
  finalAmount!: number;
}

@ObjectType()
export class CouponPreviewPayload {
  @Field()
  ok!: boolean;

  @Field(() => CouponPreviewModel, { nullable: true })
  preview?: CouponPreviewModel;

  @Field(() => OrderError, { nullable: true })
  error?: OrderError;
}

@ObjectType()
export class CouponModel {
  @Field()
  code!: string;

  @Field(() => Int)
  discountValue!: number;
}

@ObjectType()
export class UserAddressModel {
  @Field(() => ID)
  id!: string;

  @Field()
  receiverName!: string;

  @Field()
  phone!: string;

  @Field()
  detailAddress!: string;

  @Field()
  isDefault!: boolean;
}

@ObjectType()
export class ShopDeliveryConfigModel {
  @Field()
  deliveryEnabled!: boolean;

  @Field()
  pickupEnabled!: boolean;

  @Field()
  dineInEnabled!: boolean;

  @Field({ nullable: true })
  deliveryRadius?: number;

  @Field(() => DeliveryFeeType)
  deliveryFeeType!: DeliveryFeeType;

  @Field(() => Int, { nullable: true })
  fixedFee?: number;

  @Field(() => Int, { nullable: true })
  freeDeliveryThreshold?: number;

  @Field(() => DeliveryAcceptMode)
  deliveryAcceptMode!: DeliveryAcceptMode;

  @Field({ nullable: true })
  dineInOpenTime?: string;

  @Field({ nullable: true })
  pickupOpenTime?: string;

  @Field({ nullable: true })
  deliveryOpenTime?: string;
}

@ObjectType()
export class DeliveryCheckResultModel {
  @Field()
  deliverable!: boolean;

  @Field(() => Int)
  estimatedFee!: number;

  @Field({ nullable: true })
  reason?: string;
}

/** 订单行关联的菜品摘要（顾客端历史订单） */
@ObjectType('OrderItemProduct')
export class OrderItemProductModel {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;
}

/** 订单行：quantity + 下单时单价快照 + 嵌套 Product */
@ObjectType('OrderItem')
export class OrderHistoryItemModel {
  @Field(() => Int)
  quantity!: number;

  /** 下单时单价（分），对应 Prisma unitPriceSnapshot */
  @Field(() => Int)
  priceAtTime!: number;

  @Field(() => OrderItemProductModel)
  product!: OrderItemProductModel;
}

/** 顾客端订单列表项（GraphQL 类型名 Order） */
@ObjectType('Order')
export class OrderHistoryOrderModel {
  @Field(() => ID)
  id!: string;

  @Field(() => Int)
  totalAmount!: number;

  /** 与 Order.state 一致，字符串便于前端展示 */
  @Field(() => String)
  status!: string;

  @Field(() => String)
  createdAt!: string;

  @Field(() => [OrderHistoryItemModel])
  items!: OrderHistoryItemModel[];
}

/** 顾客端订单详情（单条查询，含门店/桌台等） */
@ObjectType('OrderDetail')
export class OrderDetailModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  orderNo!: string;

  @Field(() => Int)
  totalAmount!: number;

  @Field(() => String)
  status!: string;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String)
  shopName!: string;

  @Field(() => String, { nullable: true })
  tableName?: string | null;

  @Field(() => String)
  deliveryType!: string;

  @Field(() => [OrderHistoryItemModel])
  items!: OrderHistoryItemModel[];
}

/** Kitchen / dispatch line (admin-web order center) */
@ObjectType('MerchantDispatchOrderLine')
export class MerchantDispatchOrderLineModel {
  @Field(() => String)
  productName!: string;

  @Field(() => Int)
  quantity!: number;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;
}

/** Merchant dispatch order with line items */
@ObjectType('MerchantDispatchOrder')
export class MerchantDispatchOrderModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  orderNo!: string;

  @Field(() => Int)
  totalAmount!: number;

  @Field(() => MerchantOrderStatus)
  status!: MerchantOrderStatus;

  /** Canonical order lifecycle (PAID → PREPARING → …); use with `status` for kitchen UI. */
  @Field(() => OrderState)
  orderState!: OrderState;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String)
  shopName!: string;

  @Field(() => String, { nullable: true })
  tableName?: string | null;

  @Field(() => String, { nullable: true })
  acceptedAt?: string | null;

  @Field(() => String, { nullable: true })
  completedAt?: string | null;

  @Field(() => [MerchantDispatchOrderLineModel])
  items!: MerchantDispatchOrderLineModel[];
}
