import { Query, Resolver } from '@nestjs/graphql';
import { OpsService } from './ops.service';
import {
  AlertStatusModel,
  DependencyHealthModel,
  ObservabilityMetricsModel,
  PaymentMetricsModel,
} from './ops.types';

@Resolver()
export class OpsResolver {
  constructor(private readonly opsService: OpsService) {}

  @Query(() => DependencyHealthModel)
  dependencyHealth(): Promise<DependencyHealthModel> {
    return this.opsService.dependencyHealth();
  }

  @Query(() => PaymentMetricsModel)
  paymentMetrics(): PaymentMetricsModel {
    return this.opsService.paymentMetrics();
  }

  @Query(() => ObservabilityMetricsModel)
  observabilityMetrics(): ObservabilityMetricsModel {
    return this.opsService.observabilityMetrics();
  }

  @Query(() => AlertStatusModel)
  alertStatus(): AlertStatusModel {
    return this.opsService.alertStatus();
  }
}
