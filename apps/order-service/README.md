# Order Service

NestJS GraphQL backend for E-Joy. This service owns the Prisma schema, PostgreSQL access, order lifecycle, shop/admin APIs, staff workflows, payments, uploads, and local seed data.

## Local Setup From Repo Root

Run these commands from the repository root:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
docker compose up -d postgres redis kafka meilisearch
docker compose run --rm prisma-init
pnpm --filter order-service run start:dev
```

GraphQL runs at:

```text
http://localhost:9602/graphql
```

## Prisma And Seed Data

The Docker setup command:

```bash
docker compose run --rm prisma-init
```

runs:

```bash
pnpm --filter order-service exec prisma db push
pnpm --filter order-service exec prisma generate
pnpm --filter order-service run db:seed
```

Seeded local data includes:

- Shop ID: `test-shop-001`
- Manager phone: `0911000000`
- Manager password: `Admin@123456`
- Platform owner identifier: `owner@ejoy.local`
- Platform owner password: `Owner@123456`
- Demo products and dining tables

To rerun seed data only:

```bash
pnpm --filter order-service run db:seed
```

To reset all local database data:

```bash
docker compose down -v
docker compose up -d postgres redis kafka meilisearch
docker compose run --rm prisma-init
```

## Environment

For host/local dev, `apps/order-service/.env` should point at the Compose-exposed PostgreSQL port:

```bash
DATABASE_URL=postgresql://ejoy:ejoy123@127.0.0.1:5433/ejoy
```

Inside Docker Compose, use the service hostname:

```bash
DATABASE_URL=postgresql://ejoy:ejoy123@postgres:5432/ejoy
```

Do not use `localhost:5432` from inside a Compose container; that points to the container itself, not the PostgreSQL service.

## Common Commands

```bash
pnpm --filter order-service run start:dev
pnpm --filter order-service run test
pnpm --filter order-service run type-check
pnpm --filter order-service exec prisma generate
pnpm --filter order-service exec prisma db push
pnpm --filter order-service run db:seed
```

## Troubleshooting

If `docker compose run --rm prisma-init` fails with:

```text
Cannot find module '/workspace/apps/order-service/node_modules/prisma/build/index.js'
```

then dependencies are missing on the host. Run this from the repo root:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
docker compose run --rm prisma-init
```

If Corepack asks to download pnpm, accept it or run `corepack prepare pnpm@10.33.0 --activate` first. The repo intentionally uses the pnpm version pinned in the root `package.json`.
