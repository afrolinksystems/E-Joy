import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import {
  Allow,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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
  @Allow()
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  phone!: string;

  @Allow()
  @Field(() => StaffRoleInput, { defaultValue: StaffRoleInput.WAITER })
  @IsEnum(StaffRoleInput)
  role!: StaffRoleInput;
}

@InputType()
export class UpdateStaffInput {
  @Allow()
  @Field({ nullable: true })
  name?: string;

  @Allow()
  @Field({ nullable: true })
  phone?: string;

  @Allow()
  @Field(() => StaffRoleInput, { nullable: true })
  role?: StaffRoleInput;

  @Allow()
  @Field(() => StaffStatusInput, { nullable: true })
  status?: StaffStatusInput;
}

@InputType()
export class CreatePrinterInput {
  @Allow()
  @Field()
  name!: string;

  @Allow()
  @Field(() => PrinterTypeInput, { defaultValue: PrinterTypeInput.ETHERNET })
  printerType!: PrinterTypeInput;

  @Allow()
  @Field({ nullable: true })
  ipAddress?: string;

  @Allow()
  @Field({ nullable: true })
  port?: number;

  @Allow()
  @Field(() => PaperSizeInput, { defaultValue: PaperSizeInput.THERMAL_80MM })
  paperSize!: PaperSizeInput;

  @Allow()
  @Field(() => [String], { defaultValue: [] })
  categoryFilter!: string[];

  @Allow()
  @Field({ defaultValue: true })
  enabled!: boolean;
}

@InputType()
export class UpdatePrinterInput {
  @Allow()
  @Field({ nullable: true })
  name?: string;

  @Allow()
  @Field(() => PrinterTypeInput, { nullable: true })
  printerType?: PrinterTypeInput;

  @Allow()
  @Field({ nullable: true })
  ipAddress?: string;

  @Allow()
  @Field({ nullable: true })
  port?: number;

  @Allow()
  @Field(() => PaperSizeInput, { nullable: true })
  paperSize?: PaperSizeInput;

  @Allow()
  @Field(() => [String], { nullable: true })
  categoryFilter?: string[];

  @Allow()
  @Field({ nullable: true })
  enabled?: boolean;
}

@InputType()
export class CreatePlatformCouponInput {
  @Allow()
  @Field()
  code!: string;

  @Allow()
  @Field()
  discountValue!: number;

  @Allow()
  @Field()
  validFrom!: string;

  @Allow()
  @Field()
  validUntil!: string;

  @Allow()
  @Field({ nullable: true })
  usageLimit?: number;

  @Allow()
  @Field(() => PlatformCouponStatusInput, {
    defaultValue: PlatformCouponStatusInput.ACTIVE,
  })
  status!: PlatformCouponStatusInput;

  @Allow()
  @Field(() => PlatformCouponRuleTypeInput, {
    defaultValue: PlatformCouponRuleTypeInput.NEW_USER,
  })
  ruleType!: PlatformCouponRuleTypeInput;

  @Allow()
  @Field({ nullable: true })
  minOrderAmount?: number;

  @Allow()
  @Field(() => [String], { defaultValue: [] })
  targetShopIds!: string[];

  @Allow()
  @Field(() => [String], { defaultValue: [] })
  targetProductIds!: string[];
}

@InputType()
export class UpdatePerformanceRuleInput {
  @Allow()
  @Field()
  responseRateWeight!: number;

  @Allow()
  @Field()
  avgResponseSecondsWeight!: number;

  @Allow()
  @Field()
  resolvedCountWeight!: number;

  @Allow()
  @Field({ nullable: true })
  rewardRulesJson?: string;
}

@InputType()
export class ReportRangeInput {
  @Allow()
  @Field(() => ReportPeriodInput, { defaultValue: ReportPeriodInput.DAY })
  period!: ReportPeriodInput;
}

@InputType()
export class UpdateManagedShopInput {
  @Allow()
  @Field({ nullable: true })
  name?: string;

  @Allow()
  @Field({ nullable: true })
  online?: boolean;
}

@InputType()
export class ManagedShopsFilterInput {
  @Allow()
  @Field({ nullable: true })
  search?: string;

  @Allow()
  @Field({ nullable: true })
  online?: boolean;
}

@InputType()
export class ApproveShopApplicationInput {
  @Allow()
  @Field({ nullable: true })
  shopName?: string;

  @Allow()
  @Field({ nullable: true })
  managerName?: string;

  @Allow()
  @Field({ nullable: true })
  managerPhone?: string;
}

@InputType()
export class UpdateShopPaymentConfigInput {
  @Allow()
  @Field({ nullable: true })
  provider?: string;

  @Allow()
  @Field({ nullable: true })
  merchantId?: string;

  @Allow()
  @Field({ nullable: true })
  appId?: string;

  @Allow()
  @Field({ nullable: true })
  enabled?: boolean;

  @Allow()
  @Field({ nullable: true })
  testMode?: boolean;
}

@InputType()
export class PlatformAuditLogFilterInput {
  @Allow()
  @Field({ nullable: true })
  action?: string;

  @Allow()
  @Field({ nullable: true })
  actorId?: string;

  @Allow()
  @Field({ nullable: true })
  targetType?: string;

  @Allow()
  @Field({ nullable: true })
  targetId?: string;

  @Allow()
  @Field({ nullable: true })
  limit?: number;
}

@InputType()
export class CreateBannerInput {
  @Allow()
  @Field()
  title!: string;

  @Allow()
  @Field()
  imageUrl!: string;

  @Allow()
  @Field({ nullable: true })
  linkUrl?: string;

  @Allow()
  @Field(() => BannerStatusInput, { defaultValue: BannerStatusInput.ACTIVE })
  status!: BannerStatusInput;
}

@InputType()
export class CreateProductInput {
  @Allow()
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  category!: string;

  /** 单价，整数，单位：分（ETB cent） */
  @Allow()
  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  unitPrice!: number;

  @Allow()
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  imageUrl?: string;

  @Allow()
  @Field({ defaultValue: true })
  @IsBoolean()
  active!: boolean;
}

@InputType()
export class UpdateProductInput {
  @Allow()
  @Field({ nullable: true })
  name?: string;

  @Allow()
  @Field({ nullable: true })
  category?: string;

  @Allow()
  @Field({ nullable: true })
  unitPrice?: number;

  @Allow()
  @Field(() => String, { nullable: true })
  imageUrl?: string;

  @Allow()
  @Field({ nullable: true })
  active?: boolean;
}

@InputType()
export class CustomerThemeOverridesInput {
  @Allow()
  @Field({ nullable: true })
  primary?: string;

  @Allow()
  @Field({ nullable: true })
  primaryForeground?: string;

  @Allow()
  @Field({ nullable: true })
  secondary?: string;

  @Allow()
  @Field({ nullable: true })
  secondaryForeground?: string;

  @Allow()
  @Field({ nullable: true })
  accent?: string;

  @Allow()
  @Field({ nullable: true })
  accentForeground?: string;

  @Allow()
  @Field({ nullable: true })
  background?: string;

  @Allow()
  @Field({ nullable: true })
  foreground?: string;

  @Allow()
  @Field({ nullable: true })
  card?: string;

  @Allow()
  @Field({ nullable: true })
  cardForeground?: string;

  @Allow()
  @Field({ nullable: true })
  muted?: string;

  @Allow()
  @Field({ nullable: true })
  mutedForeground?: string;

  @Allow()
  @Field({ nullable: true })
  border?: string;

  @Allow()
  @Field({ nullable: true })
  ring?: string;
}

@InputType()
export class UpdateShopInput {
  @Allow()
  @Field({ nullable: true })
  name?: string;

  @Allow()
  @Field({ nullable: true })
  description?: string;

  @Allow()
  @Field({ nullable: true })
  contactPhone?: string;

  @Allow()
  @Field({ nullable: true })
  logoUrl?: string;

  @Allow()
  @Field({ nullable: true })
  customerThemePreset?: string;

  @Allow()
  @Field(() => CustomerThemeOverridesInput, { nullable: true })
  customerThemeOverrides?: CustomerThemeOverridesInput;

  /** 营业中 true / 打烊 false，对应 Shop.active */
  @Allow()
  @Field({ nullable: true })
  isOpen?: boolean;
}

@InputType()
export class CreateShopApplicationInput {
  @Allow()
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  shopName!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  contactName!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  contactPhone!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  businessLicense!: string;
}
