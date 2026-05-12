import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const fallbackLocalDbUrl = 'postgresql://ejoy:ejoy123@localhost:5433/ejoy';
    const isProd = process.env.NODE_ENV === 'production';
    const prodConnectionString = process.env.DATABASE_URL?.trim();
    if (isProd && !prodConnectionString) {
      throw new Error('DATABASE_URL is required for Prisma adapter');
    }
    // In local/dev, prefer explicit LOCAL_DATABASE_URL or Docker default URL.
    // This avoids picking up a stale global DATABASE_URL from terminal environment.
    const connectionString = isProd
      ? (prodConnectionString as string)
      : process.env.LOCAL_DATABASE_URL?.trim() || fallbackLocalDbUrl;
    super({
      adapter: new PrismaPg({
        connectionString,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
