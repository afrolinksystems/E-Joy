# E-Joy

E-Joy is a monorepo for a restaurant ordering platform. It includes customer ordering, merchant operations, platform administration, payments, uploads, reporting, and local infrastructure for development.

## Tech Stack

- Monorepo: pnpm workspace + Turbo
- Backend: NestJS, GraphQL, Prisma, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Realtime/API client: Apollo Client + GraphQL subscriptions
- Local infrastructure: Docker Compose with PostgreSQL, Redis, Kafka, and Meilisearch
- Testing/tooling: Jest, ESLint, TypeScript

## Architecture

The repository is organized as independent apps inside `apps/`, with shared local infrastructure at the repo root.

- `apps/order-service` - Core NestJS backend. Owns GraphQL APIs, Prisma schema, order lifecycle, admin operations, payments, uploads, observability checks, and seed scripts.
- `apps/customer-web` - Customer ordering experience for browsing menus, cart/checkout, payment flow, and order history.
- `apps/admin-web` - Merchant/admin dashboard for products, tables, staff, orders, receipts, reports, and shop settings.
- `apps/super-admin-web` - Platform-level administration app for managing shops and higher-level operational views.
- `apps/mawa-web` - Public Mawa web experience connected to the ordering backend.
- `docker-compose.yml` - Local development services and database bootstrap support.

At runtime, the frontend apps talk to `order-service` over GraphQL. The backend persists data in PostgreSQL through Prisma, uses Redis/Kafka where applicable for operational flows, and exposes static upload assets from the service.

## Prerequisites

- Node.js `>=22.12.0`
- pnpm `>=10`
- Docker + Docker Compose

The repo includes `.nvmrc` and a pinned pnpm version in `package.json`.

## Clone And Install

```bash
git clone <repo-url>
cd E-Joy
corepack enable
pnpm install
```

## Start Local Development

Start the local infrastructure:

```bash
docker compose up -d
```

Initialize or refresh the local database schema, Prisma client, and seed data:

```bash
docker compose run --rm prisma-init
```

Start all development apps through Turbo:

```bash
pnpm dev
```

Default local URLs:

- Order service GraphQL: `http://localhost:9602/graphql`
- Customer web: `http://localhost:9601`
- Admin web: `http://localhost:9603`
- Super admin web: `http://localhost:9604`
- Mawa web: `http://localhost:9605`

## Run One App

```bash
pnpm --filter order-service run start:dev
pnpm --filter customer-web run dev
pnpm --filter admin-web run dev
pnpm --filter super-admin-web run dev
pnpm --filter mawa-web run dev
```

## Local Docker Services

- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- Kafka: `localhost:9094`
- Meilisearch: `http://localhost:7700`

`prisma-init` runs the backend Prisma setup in Docker after PostgreSQL is healthy.

## Common Commands

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Package-scoped examples:

```bash
pnpm --filter order-service run test
pnpm --filter order-service run type-check
pnpm --filter admin-web run lint
pnpm --filter customer-web run build
```

## Troubleshooting

If database tables are missing, rerun:

```bash
docker compose run --rm prisma-init
```

If a frontend does not pick up configuration changes, restart its Vite dev server.

If the backend cannot connect to PostgreSQL, confirm Docker is running and the local database is available on `localhost:5433`.
