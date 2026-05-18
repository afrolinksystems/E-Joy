import { Field, InputType } from '@nestjs/graphql';
import {
  Allow,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { StaffRoleInput } from '../admin/admin.inputs';
import { ServiceTicketStatus, StaffPerformancePeriod } from './staff.types';

@InputType()
export class CreateStaffAccountInput {
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

  /** Plaintext; stored as bcrypt hash server-side. */
  @Allow()
  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @Allow()
  @Field(() => StaffRoleInput, { defaultValue: StaffRoleInput.WAITER })
  @IsEnum(StaffRoleInput)
  role!: StaffRoleInput;
}

@InputType()
export class ChangePasswordInput {
  @Allow()
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  newPassword!: string;
}

@InputType()
export class UpdateStaffRoleInput {
  @Allow()
  @Field()
  @IsString()
  @MaxLength(128)
  userId!: string;

  @Allow()
  @Field(() => StaffRoleInput)
  @IsEnum(StaffRoleInput)
  newRole!: StaffRoleInput;
}

@InputType()
export class CallWaiterInput {
  @Allow()
  @Field()
  @IsString()
  @MaxLength(128)
  shopId!: string;

  @Allow()
  @Field()
  @IsString()
  @MaxLength(128)
  tableId!: string;

  @Allow()
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  reason!: string;
}

@InputType()
export class UpdateServiceTicketStatusInput {
  @Allow()
  @Field()
  @IsString()
  @MaxLength(128)
  ticketId!: string;

  @Allow()
  @Field(() => ServiceTicketStatus)
  status!: ServiceTicketStatus;
}

@InputType()
export class AcceptServiceTicketInput {
  @Allow()
  @Field()
  @IsString()
  @MaxLength(128)
  ticketId!: string;
}

@InputType()
export class ResolveServiceTicketInput {
  @Allow()
  @Field()
  @IsString()
  @MaxLength(128)
  ticketId!: string;
}

@InputType()
export class StaffNotificationFilterInput {
  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  unreadOnly?: boolean;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  page?: number;

  @Allow()
  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

@InputType()
export class MarkStaffNotificationReadInput {
  @Allow()
  @Field()
  @IsString()
  @MaxLength(128)
  notificationId!: string;
}

@InputType()
export class StaffPerformanceRangeInput {
  @Allow()
  @Field(() => StaffPerformancePeriod, {
    defaultValue: StaffPerformancePeriod.DAY,
  })
  period!: StaffPerformancePeriod;
}
