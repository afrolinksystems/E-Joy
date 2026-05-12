import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SensitiveActionVerificationInput {
  @Field()
  code!: string;

  @Field({ nullable: true })
  reason?: string;
}
