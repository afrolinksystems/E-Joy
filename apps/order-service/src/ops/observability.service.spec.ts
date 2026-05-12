import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  it('computes metrics and triggers alert chain', () => {
    const service = new ObservabilityService();
    for (let i = 0; i < 100; i += 1) {
      service.recordRequest({
        durationMs: i < 20 ? 1500 : 120,
        statusCode: i < 8 ? 500 : 200,
        traceIdPresent: i < 90,
      });
    }

    const metrics = service.snapshot();
    expect(metrics.totalRequests).toBe(100);
    expect(metrics.errorRatePct).toBe(8);
    expect(metrics.slowRatePct).toBe(20);
    expect(metrics.traceCoveragePct).toBe(90);

    const alert = service.alertStatus();
    expect(alert.errorRateAlert).toBe(true);
    expect(alert.slowRateAlert).toBe(true);
    expect(alert.traceCoverageAlert).toBe(true);
    expect(alert.alertChainVerified).toBe(true);
  });
});
