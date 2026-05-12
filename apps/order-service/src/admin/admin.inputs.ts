import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

export enum StaffRoleInput {
  WAITER = 'WAITER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  KITCHEN = 'KITCHEN',
}

export enum StaffStatusInput {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

registerEnumType(StaffRoleInput, { name: 'StaffRoleInput' });
registerEnumType(StaffStatusInput, { name: 'StaffStatusInput' });

export enum PrinterTypeInput {
  ETHERNET = 'ETHERNET',
  USB = 'USB',
  BLUETOOTH = 'BLUETOOTH',
}

export enum PaperSizeInput {
  THERMAL_58MM = 'THERMAL_58MM',
  THERMAL_80MM = 'THERMAL_80MM',
  A4 = 'A4',
}

registerEnumType(PrinterTypeInput, { name: 'PrinterTypeInput' });
registerEnumType(PaperSizeInput, { name: 'PaperSizeInput' });

export enum PlatformCouponStatusInput {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

registerEnumType(PlatformCouponStatusInput, {
  name: 'PlatformCouponStatusInput',
});

export enum PlatformCouponRuleTypeInput {
  NEW_USER = 'NEW_USER',
  MIN_ORDER = 'MIN_ORDER',
  TARGET_SCOPE = 'TARGET_SCOPE',
}

registerEnumType(PlatformCouponRuleTypeInput, {
  name: 'PlatformCouponRuleTypeInput',
});

export enum BannerStatusInput {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

registerEnumType(BannerStatusInput, { name: 'BannerStatusInput' });

export enum ReportPeriodInput {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

registerEnumType(ReportPeriodInput, { name: 'ReportPeriodInput' });

@InputType()
export class CreateStaffInput {
  @Field()
  name!: string;

  @Field()
  phone!: string;

  @Field(() => StaffRoleInput, { defaultValue: StaffRoleInput.WAITER })
  role!: StaffRoleInput;
}

@InputType()
export class UpdateStaffInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => StaffRoleInput, { nullable: true })
  role?: StaffRoleInput;

  @Field(() => StaffStatusInput, { nullable: true })
  status?: StaffStatusInput;
}

@InputType()
export class CreatePrinterInput {
  @Field()
  name!: string;

  @Field(() => PrinterTypeInput, { defaultValue: PrinterTypeInput.ETHERNET })
  printerType!: PrinterTypeInput;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  port?: number;

  @Field(() => PaperSizeInput, { defaultValue: PaperSizeInput.THERMAL_80MM })
  paperSize!: PaperSizeInput;

  @Field(() => [String], { defaultValue: [] })
  categoryFilter!: string[];

  @Field({ defaultValue: true })
  enabled!: boolean;
}

@InputType()
export class UpdatePrinterInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => PrinterTypeInput, { nullable: true })
  printerType?: PrinterTypeInput;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  port?: number;

  @Field(() => PaperSizeInput, { nullable: true })
  paperSize?: PaperSizeInput;

  @Field(() => [String], { nullable: true })
  categoryFilter?: string[];

  @Field({ nullable: true })
  enabled?: boolean;
}

@InputType()
export class CreatePlatformCouponInput {
  @Field()
  code!: string;

  @Field()
  discountValue!: number;

  @Field()
  validFrom!: string;

  @Field()
  validUntil!: string;

  @Field({ nullable: true })
  usageLimit?: number;

  @Field(() => PlatformCouponStatusInput, {
    defaultValue: PlatformCouponStatusInput.ACTIVE,
  })
  status!: PlatformCouponStatusInput;

  @Field(() => PlatformCouponRuleTypeInput, {
    defaultValue: PlatformCouponRuleTypeInput.NEW_USER,
  })
  ruleType!: PlatformCouponRuleTypeInput;

  @Field({ nullable: true })
  minOrderAmount?: number;

  @Field(() => [String], { defaultValue: [] })
  targetShopIds!: string[];

  @Field(() => [String], { defaultValue: [] })
  targetProductIds!: string[];
}

@InputType()
export class UpdatePerformanceRuleInput {
  @Field()
  responseRateWeight!: number;

  @Field()
  avgResponseSecondsWeight!: number;

  @Field()
  resolvedCountWeight!: number;

  @Field({ nullable: true })
  rewardRulesJson?: string;
}

@InputType()
export class ReportRangeInput {
  @Field(() => ReportPeriodInput, { defaultValue: ReportPeriodInput.DAY })
  period!: ReportPeriodInput;
}

@InputType()
export class UpdateManagedShopInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  online?: boolean;
}

@InputType()
export class ManagedShopsFilterInput {
  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  online?: boolean;
}

@InputType()
export class ApproveShopApplicationInput {
  @Field({ nullable: true })
  shopName?: string;

  @Field({ nullable: true })
  managerName?: string;

  @Field({ nullable: true })
  managerPhone?: string;
}

@InputType()
export class UpdateShopPaymentConfigInput {
  @Field({ nullable: true })
  provider?: string;

  @Field({ nullable: true })
  merchantId?: string;

  @Field({ nullable: true })
  appId?: string;

  @Field({ nullable: true })
  enabled?: boolean;

  @Field({ nullable: true })
  testMode?: boolean;
}

@InputType()
export class PlatformAuditLogFilterInput {
  @Field({ nullable: true })
  action?: string;

  @Field({ nullable: true })
  actorId?: string;

  @Field({ nullable: true })
  targetType?: string;

  @Field({ nullable: true })
  targetId?: string;

  @Field({ nullable: true })
  limit?: number;
}

@InputType()
export class CreateBannerInput {
  @Field()
  title!: string;

  @Field()
  imageUrl!: string;

  @Field({ nullable: true })
  linkUrl?: string;

  @Field(() => BannerStatusInput, { defaultValue: BannerStatusInput.ACTIVE })
  status!: BannerStatusInput;
}

@InputType()
export class CreateProductInput {
  @Field()
  name!: string;

  @Field()
  category!: string;

  /** 单价，整数，单位：分（ETB cent） */
  @Field(() => Int)
  unitPrice!: number;

  @Field(() => String, { nullable: true })
  imageUrl?: string;

  @Field({ defaultValue: true })
  active!: boolean;
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  category?: string;

  @Field({ nullable: true })
  unitPrice?: number;

  @Field(() => String, { nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  active?: boolean;
}

@InputType()
export class UpdateShopInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  contactPhone?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  /** 营业中 true / 打烊 false，对应 Shop.active */
  @Field({ nullable: true })
  isOpen?: boolean;
}

@InputType()
export class CreateShopApplicationInput {
  @Field()
  shopName!: string;

  @Field()
  contactName!: string;

  @Field()
  contactPhone!: string;

  @Field()
  businessLicense!: string;
}
