import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('CustomerThemeOverrides')
export class CustomerThemeOverridesModel {
  @Field({ nullable: true })
  primary?: string;

  @Field({ nullable: true })
  primaryForeground?: string;

  @Field({ nullable: true })
  secondary?: string;

  @Field({ nullable: true })
  secondaryForeground?: string;

  @Field({ nullable: true })
  accent?: string;

  @Field({ nullable: true })
  accentForeground?: string;

  @Field({ nullable: true })
  background?: string;

  @Field({ nullable: true })
  foreground?: string;

  @Field({ nullable: true })
  card?: string;

  @Field({ nullable: true })
  cardForeground?: string;

  @Field({ nullable: true })
  muted?: string;

  @Field({ nullable: true })
  mutedForeground?: string;

  @Field({ nullable: true })
  border?: string;

  @Field({ nullable: true })
  ring?: string;
}

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

  @Field({ nullable: true })
  customerThemePreset?: string;

  @Field(() => CustomerThemeOverridesModel, { nullable: true })
  customerThemeOverrides?: CustomerThemeOverridesModel;

  @Field()
  active!: boolean;
}
