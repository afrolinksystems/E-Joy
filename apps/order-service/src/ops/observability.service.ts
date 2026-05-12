import { Injectable } from '@nestjs/common';

type RequestMetricInput = {
  durationMs: number;
  statusCode: number;
  traceIdPresent: boolean;
};

@Injectable()
export class ObservabilityService {
  private totalRequests = 0;
  private errorRequests = 0;
  private slowRequests = 0;
  private tracedRequests = 0;
  private totalDurationMs = 0;

  recordRequest(input: RequestMetricInput): void {
    this.totalRequests += 1;
    this.totalDurationMs += input.durationMs;
    if (input.statusCode >= 500) this.errorRequests += 1;
    if (input.durationMs >= 1_000) this.slowRequests += 1;
    if (input.traceIdPresent) this.tracedRequests += 1;
  }

  snapshot(): {
    totalRequests: number;
    errorRatePct: number;
    slowRatePct: number;
    traceCoveragePct: number;
    avgLatencyMs: number;
  } {
    const safeTotal = Math.max(this.totalRequests, 1);
    return {
      totalRequests: this.totalRequests,
      errorRatePct: Number(((this.errorRequests / safeTotal) * 100).toFixed(2)),
      slowRatePct: Number(((this.slowRequests / safeTotal) * 100).toFixed(2)),
      traceCoveragePct: Number(
        ((this.tracedRequests / safeTotal) * 100).toFixed(2),
      ),
      avgLatencyMs: Number((this.totalDurationMs / safeTotal).toFixed(2)),
    };
  }

  alertStatus(): {
    errorRateAlert: boolean;
    slowRateAlert: boolean;
    traceCoverageAlert: boolean;
    alertChainVerified: boolean;
  } {
    const snapshot = this.snapshot();
    const errorRateAlert = snapshot.errorRatePct > 5;
    const slowRateAlert = snapshot.slowRatePct > 10;
    const traceCoverageAlert = snapshot.traceCoveragePct < 95;
    return {
      errorRateAlert,
      slowRateAlert,
      traceCoverageAlert,
      alertChainVerified: errorRateAlert || slowRateAlert || traceCoverageAlert,
    };
  }
}
