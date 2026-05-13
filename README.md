# E-Joy

E-Joy is a pnpm monorepo for a restaurant ordering platform. It includes customer ordering, merchant operations, platform administration, payments, uploads, reporting, and local infrastructure for development.

## Tech Stack

- Monorepo: pnpm workspace + Turbo
- Backend: NestJS, GraphQL, Prisma, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Realtime/API client: Apollo Client + GraphQL subscriptions
- Local infrastructure: Docker Compose with PostgreSQL, Redis, Kafka, and Meilisearch
- Testing/tooling: Jest, ESLint, TypeScript

## Apps

- `apps/order-service` - Core NestJS backend. Owns GraphQL APIs, Prisma schema, order lifecycle, admin operations, payments, uploads, observability checks, and seed scripts.
- `apps/customer-web` - Customer ordering experience for browsing menus, cart/checkout, payment flow, and order history.
- `apps/admin-web` - Merchant/admin dashboard for products, tables, staff, orders, receipts, reports, and shop settings.
- `apps/super-admin-web` - Platform-level administration app for managing shops and operational views.
- `apps/mawa-web` - Public Mawa web experience connected to the ordering backend.

## Prerequisites

- Node.js `>=22.12.0`
- pnpm `10.33.0` through Corepack
- Docker Desktop or Docker Engine with Docker Compose

The repo pins pnpm in `package.json` with `"packageManager": "pnpm@10.33.0"`. Use Corepack instead of installing a random global pnpm version.

## Fresh Local Setup

From a clean clone:

```bash
git clone <repo-url>
cd E-Joy
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
docker compose up -d postgres redis kafka meilisearch
docker compose run --rm prisma-init
pnpm --filter order-service run prisma:generate
pnpm dev
```

Default local URLs:

- Order service GraphQL: `http://localhost:9602/graphql`
- Customer web: `http://localhost:9601`
- Admin web: `http://localhost:9603`
- Super admin web: `http://localhost:9604`
- Mawa web: `http://localhost:9605`

## Database, Prisma, And Seed Data

`docker compose run --rm prisma-init` waits for PostgreSQL and then runs these backend setup steps:

```bash
pnpm --filter order-service exec prisma db push
pnpm --filter order-service exec prisma generate
pnpm --filter order-service run db:seed
```

The seed script creates local demo data, including:

- Shop ID: `test-shop-001`
- Manager phone: `0911000000`
- Manager password: `Admin@123456`
- Platform owner identifier: `owner@ejoy.local`
- Platform owner password: `Owner@123456`
- Demo products: Kitfo, Tibs, Shiro, Injera Firfir
- Demo dining tables for the floor/table views

To rerun only the seed script after the database already exists:

```bash
pnpm --filter order-service run db:seed
```

To refresh the schema, regenerate Prisma Client, and reseed together:

```bash
docker compose run --rm prisma-init
pnpm --filter order-service run prisma:generate
```

Run the host `prisma:generate` command after Docker init on Windows/macOS. The Docker init container prepares the database and also generates Prisma inside the container, but the host TypeScript server and `pnpm dev` need a generated client available from the host `node_modules` layout too.

For local host commands, the backend reads `apps/order-service/.env`:

```bash
DATABASE_URL=postgresql://ejoy:ejoy123@127.0.0.1:5433/ejoy
```

Inside Docker Compose, `prisma-init` uses the Docker network hostname instead:

```bash
DATABASE_URL=postgresql://ejoy:ejoy123@postgres:5432/ejoy
```

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

Start all infrastructure:

```bash
docker compose up -d
```

Stop infrastructure without deleting database data:

```bash
docker compose down
```

Delete local database, Kafka, and Meilisearch volumes when you need a completely fresh environment:

```bash
docker compose down -v
docker compose up -d postgres redis kafka meilisearch
docker compose run --rm prisma-init
```

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
pnpm --filter order-service run prisma:generate
pnpm --filter admin-web run lint
pnpm --filter customer-web run build
```

## Troubleshooting

### `Cannot find module '/workspace/apps/order-service/node_modules/prisma/build/index.js'`

This means the `prisma-init` Docker container can see the repo but cannot see installed pnpm dependencies. Run the host setup first:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
docker compose run --rm prisma-init
pnpm --filter order-service run prisma:generate
```

`prisma-init` does not run `pnpm install` for you because it bind-mounts the repo into a Linux container. Installing dependencies in that container can rewrite `node_modules` for Linux and break host development on Windows.

### Corepack Asks To Download pnpm

This is expected the first time a machine or Docker container activates the pinned pnpm version:

```text
Corepack is about to download ... pnpm-10.33.0.tgz
```

On the host, answer yes or run this once before other commands:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

The Docker `prisma-init` service sets `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` and prepares pnpm non-interactively.

### Tables Or Prisma Client Are Missing

Run:

```bash
docker compose run --rm prisma-init
```

This pushes the Prisma schema, regenerates Prisma Client, and seeds demo data.

If `pnpm dev` reports that `@prisma/client` has no exported `PrismaClient`, `OrderState`, or `Prisma`, regenerate Prisma Client on the host:

```bash
pnpm --filter order-service run prisma:generate
pnpm dev
```

### Backend Cannot Connect To PostgreSQL

Confirm Docker is running and PostgreSQL is healthy:

```bash
docker compose ps postgres
```

For host/local dev, use `127.0.0.1:5433`. For commands running inside Docker Compose, use `postgres:5432`.

### Frontend Does Not Pick Up Changes

Restart the relevant Vite dev server.
