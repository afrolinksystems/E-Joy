import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { StaffRoleModel, StaffStatusModel } from '../admin/admin.types';

export enum ServiceTicketStatus {
  OPEN = 'OPEN',
  ACCEPTED = 'ACCEPTED',
  RESOLVED = 'RESOLVED',
}

registerEnumType(ServiceTicketStatus, { name: 'ServiceTicketStatus' });

export enum ServiceTicketCallType {
  WAITER = 'WAITER',
  PAYMENT = 'PAYMENT',
  CLEANUP = 'CLEANUP',
  OTHER = 'OTHER',
}

registerEnumType(ServiceTicketCallType, { name: 'ServiceTicketCallType' });

@ObjectType()
export class ServiceTicketModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopId!: string;

  @Field()
  tableId!: string;

  @Field()
  reason!: string;

  @Field()
  requestedByUserId!: string;

  @Field(() => ServiceTicketStatus)
  status!: ServiceTicketStatus;

  @Field(() => ServiceTicketCallType)
  callType!: ServiceTicketCallType;

  @Field({ nullable: true })
  assignedStaffUserId?: string;

  @Field({ nullable: true })
  acceptedAt?: string;

  @Field({ nullable: true })
  respondedAt?: string;

  @Field({ nullable: true })
  responseDuration?: number;

  @Field({ nullable: true })
  resolvedAt?: string;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class AuthPayloadModel {
  @Field()
  accessToken!: string;

  @Field()
  expiresAt!: string;

  @Field()
  role!: string;

  @Field({ nullable: true })
  shopId?: string;

  @Field(() => [String])
  scope!: string[];
}

@ObjectType()
export class MerchantMeShopModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field()
  active!: boolean;
}

@ObjectType()
export class MerchantMeModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  phone!: string;

  @Field()
  role!: string;

  @Field()
  shopId!: string;

  @Field(() => [String])
  scope!: string[];

  @Field(() => MerchantMeShopModel)
  shop!: MerchantMeShopModel;
}

/** Shop staff row (Prisma `Staff`) for RBAC management APIs. */
@ObjectType('StaffUser')
export class StaffUserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  phone!: string;

  @Field(() => StaffRoleModel)
  role!: StaffRoleModel;

  @Field()
  shopId!: string;

  @Field(() => StaffStatusModel)
  status!: StaffStatusModel;
}

@ObjectType()
export class StaffPrintJobModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orderId!: string;

  @Field(() => ID)
  printerId!: string;

  @Field()
  status!: string;

  @Field()
  retryCount!: number;
}

export enum StaffNotificationType {
  CALL = 'CALL',
  REWARD = 'REWARD',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

registerEnumType(StaffNotificationType, { name: 'StaffNotificationType' });

@ObjectType()
export class StaffNotificationModel {
  @Field(() => ID)
  id!: string;

  @Field()
  shopId!: string;

  @Field()
  recipientUserId!: string;

  @Field(() => StaffNotificationType)
  type!: StaffNotificationType;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field({ nullable: true })
  relatedTicketId?: string;

  @Field({ nullable: true })
  readAt?: string;

  @Field()
  createdAt!: string;
}

export enum StaffPerformancePeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
}

registerEnumType(StaffPerformancePeriod, { name: 'StaffPerformancePeriod' });

@ObjectType()
export class StaffPerformanceModel {
  @Field()
  staffUserId!: string;

  @Field()
  period!: string;

  @Field()
  responseRatePct!: number;

  @Field()
  avgResponseSeconds!: number;

  @Field()
  handledCount!: number;

  @Field()
  points!: number;
}

@ObjectType()
export class StaffPromotionCodeModel {
  @Field()
  code!: string;

  @Field()
  shortLink!: string;

  @Field()
  qrContent!: string;
}

@ObjectType()
export class StaffPromotionStatsModel {
  @Field()
  inviteClicks!: number;

  @Field()
  newUsers!: number;

  @Field()
  orderContributions!: number;

  @Field()
  conversionRatePct!: number;
}
