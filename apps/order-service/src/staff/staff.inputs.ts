import { Field, InputType } from '@nestjs/graphql';
import { StaffRoleInput } from '../admin/admin.inputs';
import { ServiceTicketStatus, StaffPerformancePeriod } from './staff.types';

@InputType()
export class CreateStaffAccountInput {
  @Field()
  name!: string;

  @Field()
  phone!: string;

  /** Plaintext; stored as bcrypt hash server-side. */
  @Field()
  password!: string;

  @Field(() => StaffRoleInput, { defaultValue: StaffRoleInput.WAITER })
  role!: StaffRoleInput;
}

@InputType()
export class UpdateStaffRoleInput {
  @Field()
  userId!: string;

  @Field(() => StaffRoleInput)
  newRole!: StaffRoleInput;
}

@InputType()
export class CallWaiterInput {
  @Field()
  shopId!: string;

  @Field()
  tableId!: string;

  @Field()
  reason!: string;
}

@InputType()
export class UpdateServiceTicketStatusInput {
  @Field()
  ticketId!: string;

  @Field(() => ServiceTicketStatus)
  status!: ServiceTicketStatus;
}

@InputType()
export class AcceptServiceTicketInput {
  @Field()
  ticketId!: string;
}

@InputType()
export class ResolveServiceTicketInput {
  @Field()
  ticketId!: string;
}

@InputType()
export class StaffNotificationFilterInput {
  @Field({ nullable: true })
  unreadOnly?: boolean;

  @Field({ nullable: true })
  page?: number;

  @Field({ nullable: true })
  pageSize?: number;
}

@InputType()
export class MarkStaffNotificationReadInput {
  @Field()
  notificationId!: string;
}

@InputType()
export class StaffPerformanceRangeInput {
  @Field(() => StaffPerformancePeriod, {
    defaultValue: StaffPerformancePeriod.DAY,
  })
  period!: StaffPerformancePeriod;
}
