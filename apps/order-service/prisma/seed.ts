import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is missing. Set it in apps/order-service/.env (e.g. postgresql://ejoy:ejoy123@localhost:5433/ejoy)',
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ['error'],
});

function getSeedManagerPassword(): string {
  const configured = process.env.SEED_MANAGER_PASSWORD?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SEED_MANAGER_PASSWORD is required when seeding production');
  }
  return 'Admin@123456';
}

function getSeedPlatformPassword(): string {
  const configured = process.env.SEED_PLATFORM_ADMIN_PASSWORD?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SEED_PLATFORM_ADMIN_PASSWORD is required when seeding production',
    );
  }
  return 'Owner@123456';
}

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: 'test-shop-001' },
    update: {},
    create: {
      id: 'test-shop-001',
      name: 'E-Joy Addis Ababa',
    },
  });

  const productSeeds = [
    { name: 'Kitfo', unitPrice: 42000, category: 'Popular' },
    { name: 'Tibs', unitPrice: 38000, category: 'Main' },
    { name: 'Shiro', unitPrice: 20000, category: 'Vegetarian' },
    { name: 'Injera Firfir', unitPrice: 18000, category: 'Breakfast' },
  ];
  for (const product of productSeeds) {
    const existing = await prisma.product.findFirst({
      where: { shopId: shop.id, name: product.name },
      select: { id: true },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...product, active: true },
      });
    } else {
      await prisma.product.create({
        data: { shopId: shop.id, ...product, active: true },
      });
    }
  }

  await prisma.diningTable.upsert({
    where: { id: 'test-table-001' },
    create: {
      id: 'test-table-001',
      shopId: shop.id,
      name: 'Hall A12',
      capacity: 4,
      posX: 0.5,
      posY: 0.45,
    },
    update: { posX: 0.5, posY: 0.45, capacity: 4 },
  });

  const floorSeeds = [
    { name: 'Hall A1', posX: 0.18, posY: 0.22 },
    { name: 'Hall A2', posX: 0.42, posY: 0.22 },
    { name: 'Hall A3', posX: 0.66, posY: 0.22 },
    { name: 'Window B1', posX: 0.25, posY: 0.62 },
    { name: 'Window B2', posX: 0.55, posY: 0.62 },
  ];
  for (const t of floorSeeds) {
    await prisma.diningTable.upsert({
      where: { shopId_name: { shopId: shop.id, name: t.name } },
      create: {
        shopId: shop.id,
        name: t.name,
        capacity: 4,
        posX: t.posX,
        posY: t.posY,
      },
      update: { posX: t.posX, posY: t.posY },
    });
  }

  const managerPasswordHash = await bcrypt.hash(getSeedManagerPassword(), 10);
  await prisma.staff.upsert({
    where: { phone: '0911000000' },
    create: {
      shopId: shop.id,
      name: 'Demo Manager',
      phone: '0911000000',
      role: 'MANAGER',
      status: 'ACTIVE',
      passwordHash: managerPasswordHash,
    },
    update: {
      shopId: shop.id,
      name: 'Demo Manager',
      role: 'MANAGER',
      status: 'ACTIVE',
      passwordHash: managerPasswordHash,
    },
  });

  await prisma.platformAdmin.upsert({
    where: { identifier: 'owner@ejoy.local' },
    create: {
      name: 'E-Joy Owner',
      identifier: 'owner@ejoy.local',
      role: 'OWNER',
      status: 'ACTIVE',
      passwordHash: await bcrypt.hash(getSeedPlatformPassword(), 10),
    },
    update: {
      name: 'E-Joy Owner',
      role: 'OWNER',
      status: 'ACTIVE',
      passwordHash: await bcrypt.hash(getSeedPlatformPassword(), 10),
    },
  });

  console.log('✅ E-Joy 测试数据注入成功！Shop ID: test-shop-001');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
