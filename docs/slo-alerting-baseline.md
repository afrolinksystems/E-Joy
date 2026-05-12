# SLO & Alerting Baseline

## Core SLO

- API availability: 99.9% (monthly)
- `createOrder` P95 latency: < 400ms
- Payment callback success ratio: > 98%
- Callback replay rejection precision: 100%

## Alert Thresholds

- 5xx ratio > 2% for 5 min
- callback failure ratio > 5% for 10 min
- callback conflict (`PAYMENT_CALLBACK_TXN_CONFLICT`) spikes > 20/5 min
- db connection failure > 1 min continuous

## Dashboard Panels

- QPS / error rate / P95 latency
- order created / paid / cancelled counts
- payment callback success/failed/replayed counts
- staff ticket open/accepted/resolved trend
