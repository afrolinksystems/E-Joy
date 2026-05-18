import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  DeliveryAcceptMode,
  DeliveryFeeType,
  DeliveryType,
  PaymentChannel,
  PaymentMethod,
} from './order.types';

@InputType()
export class CreateOrderItemInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  productId!: string;

  @Allow()
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(99)
  amount!: number;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  remark?: string;
}

@InputType()
export class CreateOrderInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  shopId!: string;

  @Allow()
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tableId?: string;

  /** 桌号（与 tableId 二选一或并存；任一方有值则按堂食处理并免收配送费） */
  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  tableNumber?: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey!: string;

  @Allow()
  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Allow()
  @Field(() => DeliveryType, { defaultValue: DeliveryType.DINE_IN })
  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @Allow()
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  addressId?: string;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  pickupTime?: string;

  @Allow()
  @Field(() => [CreateOrderItemInput])
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items!: CreateOrderItemInput[];

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  couponCode?: string;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

@InputType()
export class InitiatePaymentInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  orderId!: string;

  @Allow()
  @Field(() => PaymentChannel)
  @IsEnum(PaymentChannel)
  channel!: PaymentChannel;
}

@InputType()
export class ConfirmPaymentCallbackInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  orderId!: string;

  @Allow()
  @Field()
  @IsString()
  @MaxLength(160)
  providerTxnId!: string;

  @Allow()
  @Field()
  @IsString()
  @MaxLength(32)
  callbackStatus!: string;

  @Allow()
  @Field()
  @IsString()
  @MaxLength(512)
  signature!: string;

  @Allow()
  @Field()
  @IsString()
  @MaxLength(8000)
  rawPayload!: string;
}

@InputType()
export class ApplyCouponInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  shopId!: string;

  @Allow()
  @Field()
  @IsString()
  @MaxLength(64)
  couponCode!: string;

  @Allow()
  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  subtotalAmount!: number;
}

@InputType()
export class CancelOrderInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  orderId!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  reason!: string;
}

@InputType()
export class AcceptDeliveryOrderInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  orderId!: string;
}

@InputType()
export class MarkDeliveryOrderReadyInput {
  @Allow()
  @Field(() => ID)
  @IsString()
  @MaxLength(128)
  orderId!: string;
}

@InputType()
export class DeliveryOrderFilterInput {
  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  state?: string;

  @Allow()
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number;

  @Allow()
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

@InputType()
export class AddressInput {
  @Allow()
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  receiverName!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  phone!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(4)
  @MaxLength(240)
  detailAddress!: string;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

@InputType()
export class CreateAddressInput extends AddressInput {
  @Allow()
  @Field({ nullable: true })
  isDefault?: boolean;
}

@InputType()
export class UpdateAddressInput extends AddressInput {
  @Allow()
  @Field({ nullable: true })
  isDefault?: boolean;
}

@InputType()
export class DeliveryConfigInput {
  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  deliveryEnabled?: boolean;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  pickupEnabled?: boolean;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  dineInEnabled?: boolean;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  deliveryRadius?: number;

  @Allow()
  @Field(() => DeliveryFeeType, { nullable: true })
  deliveryFeeType?: DeliveryFeeType;

  @Allow()
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  fixedFee?: number;

  @Allow()
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  freeDeliveryThreshold?: number;

  @Allow()
  @Field(() => DeliveryAcceptMode, { nullable: true })
  deliveryAcceptMode?: DeliveryAcceptMode;

  @Allow()
  @Field({ nullable: true })
  dineInOpenTime?: string;

  @Allow()
  @Field({ nullable: true })
  pickupOpenTime?: string;

  @Allow()
  @Field({ nullable: true })
  deliveryOpenTime?: string;
}
