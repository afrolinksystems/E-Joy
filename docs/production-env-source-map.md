# Production Env Source Map

| Variable | Source | Owner |
|---|---|---|
| `DATABASE_URL` | Managed DB secret | Platform |
| `REDIS_URL` | Managed Redis secret | Platform |
| `KAFKA_BROKERS` | Kafka cluster config | Platform |
| `JWT_SECRET` | Secret manager | Backend |
| `TELEBIRR_APP_SECRET` | Payment provider portal | Payment |
| `TELEBIRR_PUBLIC_KEY` | Payment provider cert | Payment |
| `VITE_GRAPHQL_URL` | Deployment config | Frontend |

## Rules

- Never commit real secret values.
- Rotate secrets on every major release.
- Keep emergency break-glass credentials offline.
