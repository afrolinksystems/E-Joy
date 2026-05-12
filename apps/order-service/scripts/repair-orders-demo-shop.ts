/**
 * DEV / QA ONLY: assigns every Order row to a single shop (default test-shop-001).
 * Prisma uses `shopId` on Order — there is no `merchantId` column.
 *
 * Usage (from repo root):
 *   pnpm --filter order-service run db:repair-demo-shop
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ['error'],
});

async function main() {
  const targetShopId =
    process.env.DEMO_REPAIR_SHOP_ID?.trim() || 'test-shop-001';

  await prisma.shop.upsert({
    where: { id: targetShopId },
    update: {},
    create: {
      id: targetShopId,
      name: 'Demo repair shop',
    },
  });

  const result = await prisma.order.updateMany({
    data: { shopId: targetShopId },
  });

  console.log(
    JSON.stringify({
      ok: true,
      message: `Updated ${result.count} orders to shopId=${targetShopId}`,
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
