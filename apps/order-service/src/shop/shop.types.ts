import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Shop')
export class ShopModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  contactPhone?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  /** 营业中（true）/ 打烊（false） */
  @Field()
  active!: boolean;
}
