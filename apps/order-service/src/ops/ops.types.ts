import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DependencyHealthModel {
  @Field()
  db!: string;

  @Field()
  redis!: string;

  @Field()
  kafka!: string;
}

@ObjectType()
export class PaymentMetricsModel {
  @Field(() => Int)
  callbackSuccess!: number;

  @Field(() => Int)
  callbackFailed!: number;

  @Field(() => Int)
  callbackReplayRejected!: number;

  @Field(() => Int)
  callbackTxnConflict!: number;
}

@ObjectType()
export class ObservabilityMetricsModel {
  @Field(() => Int)
  totalRequests!: number;

  @Field()
  errorRatePct!: number;

  @Field()
  slowRatePct!: number;

  @Field()
  traceCoveragePct!: number;

  @Field()
  avgLatencyMs!: number;
}

@ObjectType()
export class AlertStatusModel {
  @Field()
  errorRateAlert!: boolean;

  @Field()
  slowRateAlert!: boolean;

  @Field()
  traceCoverageAlert!: boolean;

  @Field()
  alertChainVerified!: boolean;
}
