import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  DeliveryAcceptMode,
  DeliveryFeeType,
  DeliveryType,
  PaymentChannel,
  PaymentMethod,
} from './order.types';

@InputType()
export class CreateOrderItemInput {
  @Field(() => ID)
  productId!: string;

  @Field(() => Int)
  amount!: number;

  @Field({ nullable: true })
  remark?: string;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  shopId!: string;

  @Field(() => ID, { nullable: true })
  tableId?: string;

  /** 桌号（与 tableId 二选一或并存；任一方有值则按堂食处理并免收配送费） */
  @Field({ nullable: true })
  tableNumber?: string;

  @Field()
  idempotencyKey!: string;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Field(() => DeliveryType, { defaultValue: DeliveryType.DINE_IN })
  deliveryType?: DeliveryType;

  @Field(() => ID, { nullable: true })
  addressId?: string;

  @Field({ nullable: true })
  pickupTime?: string;

  @Field(() => [CreateOrderItemInput])
  items!: CreateOrderItemInput[];

  @Field({ nullable: true })
  couponCode?: string;

  @Field({ nullable: true })
  note?: string;
}

@InputType()
export class InitiatePaymentInput {
  @Field(() => ID)
  orderId!: string;

  @Field(() => PaymentChannel)
  channel!: PaymentChannel;
}

@InputType()
export class ConfirmPaymentCallbackInput {
  @Field(() => ID)
  orderId!: string;

  @Field()
  providerTxnId!: string;

  @Field()
  callbackStatus!: string;

  @Field()
  signature!: string;

  @Field()
  rawPayload!: string;
}

@InputType()
export class ApplyCouponInput {
  @Field(() => ID)
  shopId!: string;

  @Field()
  couponCode!: string;

  @Field(() => Int)
  subtotalAmount!: number;
}

@InputType()
export class CancelOrderInput {
  @Field(() => ID)
  orderId!: string;

  @Field()
  reason!: string;
}

@InputType()
export class AcceptDeliveryOrderInput {
  @Field(() => ID)
  orderId!: string;
}

@InputType()
export class MarkDeliveryOrderReadyInput {
  @Field(() => ID)
  orderId!: string;
}

@InputType()
export class DeliveryOrderFilterInput {
  @Field({ nullable: true })
  state?: string;

  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  pageSize?: number;
}

@InputType()
export class AddressInput {
  @Field()
  receiverName!: string;

  @Field()
  phone!: string;

  @Field()
  detailAddress!: string;

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;
}

@InputType()
export class CreateAddressInput extends AddressInput {
  @Field({ nullable: true })
  isDefault?: boolean;
}

@InputType()
export class UpdateAddressInput extends AddressInput {
  @Field({ nullable: true })
  isDefault?: boolean;
}

@InputType()
export class DeliveryConfigInput {
  @Field({ nullable: true })
  deliveryEnabled?: boolean;

  @Field({ nullable: true })
  pickupEnabled?: boolean;

  @Field({ nullable: true })
  dineInEnabled?: boolean;

  @Field({ nullable: true })
  deliveryRadius?: number;

  @Field(() => DeliveryFeeType, { nullable: true })
  deliveryFeeType?: DeliveryFeeType;

  @Field(() => Int, { nullable: true })
  fixedFee?: number;

  @Field(() => Int, { nullable: true })
  freeDeliveryThreshold?: number;

  @Field(() => DeliveryAcceptMode, { nullable: true })
  deliveryAcceptMode?: DeliveryAcceptMode;

  @Field({ nullable: true })
  dineInOpenTime?: string;

  @Field({ nullable: true })
  pickupOpenTime?: string;

  @Field({ nullable: true })
  deliveryOpenTime?: string;
}
