import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { registerEnumType, ID } from '@nestjs/graphql';

export enum StaffRoleModel {
  WAITER = 'WAITER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  KITCHEN = 'KITCHEN',
}

export enum StaffStatusModel {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

registerEnumType(StaffRoleModel, { name: 'StaffRoleModel' });
registerEnumType(StaffStatusModel, { name: 'StaffStatusModel' });

export enum ProductStatusModel {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(ProductStatusModel, { name: 'ProductStatusModel' });

export enum PrinterTypeModel {
  ETHERNET = 'ETHERNET',
  USB = 'USB',
  BLUETOOTH = 'BLUETOOTH',
}

export enum PaperSizeModel {
  THERMAL_58MM = 'THERMAL_58MM',
  THERMAL_80MM = 'THERMAL_80MM',
  A4 = 'A4',
}

export enum PrintStatusModel {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum ApplicationStatusModel {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PlatformCouponStatusModel {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export enum PlatformCouponRuleTypeModel {
  NEW_USER = 'NEW_USER',
  MIN_ORDER = 'MIN_ORDER',
  TARGET_SCOPE = 'TARGET_SCOPE',
}

export enum ManagedShopStatusModel {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum PlatformAdminStatusModel {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PlatformAdminRoleModel {
  OWNER = 'OWNER',
  OPERATOR = 'OPERATOR',
}

export enum BannerStatusModel {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

registerEnumType(PrinterTypeModel, { name: 'PrinterTypeModel' });
registerEnumType(PaperSizeModel, { name: 'PaperSizeModel' });
registerEnumType(PrintStatusModel, { name: 'PrintStatusModel' });
registerEnumType(ApplicationStatusModel, { name: 'ApplicationStatusModel' });
registerEnumType(PlatformCouponStatusModel, {
  name: 'PlatformCouponStatusModel',
});
registerEnumType(PlatformCouponRuleTypeModel, {
  name: 'PlatformCouponRuleTypeModel',
});
registerEnumType(ManagedShopStatusModel, { name: 'ManagedShopStatusModel' });
registerEnumType(BannerStatusModel, { name: 'BannerStatusModel' });
registerEnumType(PlatformAdminStatusModel, {
  name: 'PlatformAdminStatusModel',
});
registerEnumType(PlatformAdminRoleModel, { name: 'PlatformAdminRoleModel' });

@ObjectType()
export class PlatformAuthPayloadModel {
  @Field()
  accessToken!: string;

  @Field()
  role!: string;

  @Field(() => [String])
  scope!: string[];
}

@ObjectType()
export class PlatformMeModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  identifier!: string;

  @Field(() => PlatformAdminRoleModel)
  platformRole!: PlatformAdminRoleModel;

  @Field(() => [String])
  scope!: string[];
}

@ObjectType()
export class PlatformDashboardModel {
  @Field(() => Int)
  totalShops!: number;

  @Field(() => Int)
  activeShops!: number;

  @Field(() => Int)
  pendingApplications!: number;

  @Field(() => Int)
  totalOrders!: number;

  @Field(() => Int)
  paidOrders!: number;

  @Field(() => Int)
  failedPayments!: number;

  @Field(() => Int)
  totalRevenueCent!: number;
}

@ObjectType()
export class AdminDashboardModel {
  @Field(() => Int)
  totalOrders!: number;

  @Field(() => Int)
  paidOrders!: number;

  @Field(() => Int)
  paymentFailedOrders!: number;

  @Field(() => Int)
  openServiceTickets!: number;

  @Field(() => Int)
  totalRevenueCent!: number;

  @Field(() => Int)
  activeRestaurants!: number;

  @Field(() => Int)
  totalUsers!: number;

  @Field(() => [Int])
  orderTrend!: number[];
}

@ObjectType()
export class StaffModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopId!: string;

  @Field()
  name!: string;

  @Field()
  phone!: string;

  @Field(() => StaffRoleModel)
  role!: StaffRoleModel;

  @Field(() => StaffStatusModel)
  status!: StaffStatusModel;
}

@ObjectType()
export class ResetPasswordPayload {
  @Field()
  ok!: boolean;

  @Field()
  temporaryPassword!: string;
}

@ObjectType()
export class PrinterModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopId!: string;

  @Field()
  name!: string;

  @Field(() => PrinterTypeModel)
  printerType!: PrinterTypeModel;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field(() => PaperSizeModel)
  paperSize!: PaperSizeModel;

  @Field(() => [String])
  categoryFilter!: string[];

  @Field()
  enabled!: boolean;
}

@ObjectType()
export class PrintJobModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => ID)
  printerId!: string;

  @Field(() => PrintStatusModel)
  status!: PrintStatusModel;

  @Field()
  retryCount!: number;

  @Field({ nullable: true })
  errorMessage?: string;
}

@ObjectType()
export class ShopApplicationModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopName!: string;

  @Field()
  contactName!: string;

  @Field()
  contactPhone!: string;

  @Field(() => ApplicationStatusModel)
  status!: ApplicationStatusModel;

  @Field({ nullable: true })
  rejectReason?: string;

  @Field({ nullable: true })
  createdShopId?: string;
}

@ObjectType()
export class ApproveShopApplicationPayload {
  @Field()
  ok!: boolean;

  @Field({ nullable: true })
  shopId?: string;

  @Field({ nullable: true })
  managerStaffId?: string;

  @Field({ nullable: true })
  temporaryPassword?: string;
}

@ObjectType()
export class PlatformCouponModel {
  @Field(() => ID)
  id!: string;

  @Field()
  code!: string;

  @Field()
  discountValue!: number;

  @Field(() => PlatformCouponStatusModel)
  status!: PlatformCouponStatusModel;

  @Field(() => PlatformCouponRuleTypeModel)
  ruleType!: PlatformCouponRuleTypeModel;

  @Field(() => Int, { nullable: true })
  minOrderAmount?: number;

  @Field(() => [String])
  targetShopIds!: string[];

  @Field(() => [String])
  targetProductIds!: string[];
}

@ObjectType()
export class PrintRetryCycleResultModel {
  @Field(() => Int)
  processed!: number;

  @Field(() => Int)
  succeeded!: number;

  @Field(() => Int)
  failed!: number;

  @Field(() => Int)
  alerted!: number;
}

@ObjectType()
export class PerformanceRuleModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopId!: string;

  @Field(() => Int)
  responseRateWeight!: number;

  @Field(() => Int)
  avgResponseSecondsWeight!: number;

  @Field(() => Int)
  resolvedCountWeight!: number;

  @Field({ nullable: true })
  rewardRulesJson?: string;
}

@ObjectType()
export class BusinessReportModel {
  @Field(() => Int)
  orderCount!: number;

  @Field(() => Int)
  gmvCent!: number;

  @Field(() => Int)
  openTickets!: number;

  @Field(() => Int)
  acceptedTickets!: number;

  @Field(() => Int)
  resolvedTickets!: number;

  @Field(() => Int)
  avgResponseSeconds!: number;
}

@ObjectType()
export class PromotionStatsByStaffModel {
  @Field()
  staffId!: string;

  @Field()
  staffName!: string;

  @Field(() => Int)
  inviteClicks!: number;

  @Field(() => Int)
  newUsers!: number;

  @Field(() => Int)
  orderContributions!: number;

  @Field(() => Int)
  conversionRatePct!: number;
}

@ObjectType()
export class ExportPayloadModel {
  @Field()
  fileName!: string;

  @Field()
  content!: string;
}

@ObjectType()
export class ManagedShopModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => ManagedShopStatusModel)
  status!: ManagedShopStatusModel;

  @Field()
  updatedAt!: string;

  @Field({ nullable: true })
  updatedBy?: string;

  @Field(() => Int)
  orderCount!: number;

  @Field(() => Int)
  revenueCent!: number;
}

@ObjectType()
export class ShopPaymentConfigModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopId!: string;

  @Field()
  provider!: string;

  @Field({ nullable: true })
  merchantId?: string;

  @Field({ nullable: true })
  appId?: string;

  @Field()
  enabled!: boolean;

  @Field()
  testMode!: boolean;

  @Field({ nullable: true })
  updatedBy?: string;
}

@ObjectType()
export class ManagedShopDetailModel {
  @Field(() => ManagedShopModel)
  shop!: ManagedShopModel;

  @Field(() => [StaffModel])
  managers!: StaffModel[];

  @Field(() => ShopPaymentConfigModel, { nullable: true })
  paymentConfig?: ShopPaymentConfigModel;
}

@ObjectType()
export class PlatformAuditLogModel {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  actorId?: string;

  @Field()
  action!: string;

  @Field({ nullable: true })
  targetType?: string;

  @Field({ nullable: true })
  targetId?: string;

  @Field({ nullable: true })
  metadata?: string;

  @Field({ nullable: true })
  requestId?: string;

  @Field({ nullable: true })
  sourceIp?: string;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class BannerModel {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field()
  imageUrl!: string;

  @Field({ nullable: true })
  linkUrl?: string;

  @Field(() => BannerStatusModel)
  status!: BannerStatusModel;

  @Field()
  createdAt!: string;
}

@ObjectType('TopDish')
export class TopDishModel {
  @Field()
  name!: string;

  /** Line-item occurrences (rows) for this dish name in the window. */
  @Field(() => Int)
  count!: number;
}

@ObjectType('DashboardMetrics')
export class DashboardMetricsModel {
  /** Sum of `totalAmount` for qualifying orders, in major currency units (from cents). */
  @Field(() => Float)
  todayRevenue!: number;

  @Field(() => [TopDishModel])
  topDishes!: TopDishModel[];

  /** Average prep duration in minutes (`completedAt - acceptedAt`) for completed orders. */
  @Field(() => Float)
  avgPrepMinutes!: number;
}

@ObjectType()
export class ProductModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopId!: string;

  @Field()
  name!: string;

  @Field()
  category!: string;

  @Field(() => Int)
  unitPrice!: number;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field()
  active!: boolean;

  @Field(() => ProductStatusModel)
  status!: ProductStatusModel;
}
