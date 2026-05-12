import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const rawIdentifier = process.env.PLATFORM_OWNER_IDENTIFIER?.trim().toLowerCase();
const rawPassword = process.env.PLATFORM_OWNER_PASSWORD?.trim();
const name = process.env.PLATFORM_OWNER_NAME?.trim() || 'E-Joy Owner';

if (!rawIdentifier) {
  throw new Error('PLATFORM_OWNER_IDENTIFIER is required');
}

if (!rawPassword) {
  throw new Error('PLATFORM_OWNER_PASSWORD is required');
}

if (rawPassword.length < 12) {
  throw new Error('PLATFORM_OWNER_PASSWORD must be at least 12 characters');
}

const identifier: string = rawIdentifier;
const password: string = rawPassword;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ['error'],
});

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const owner = await prisma.platformAdmin.upsert({
    where: { identifier },
    create: {
      name,
      identifier,
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    },
    update: {
      name,
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log(`Platform owner ready: ${owner.identifier}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
