import { Field, Float, ID, InputType } from '@nestjs/graphql';

@InputType()
export class TablePositionInput {
  @Field(() => ID)
  id!: string;

  @Field(() => Float)
  posX!: number;

  @Field(() => Float)
  posY!: number;
}
