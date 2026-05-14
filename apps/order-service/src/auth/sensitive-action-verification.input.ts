import { Field, InputType } from '@nestjs/graphql';
import { Allow } from 'class-validator';

@InputType()
export class SensitiveActionVerificationInput {
  @Allow()
  @Field()
  code!: string;

  @Allow()
  @Field({ nullable: true })
  reason?: string;
}
