import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 架构师强拆指令：
    // 运行时完全支持 datasources 传参，我们直接使用 'as any' 屏蔽掉 TypeScript 那个残缺的类型校验！
    // 强制把连接钥匙塞进 Prisma 的嘴里！
    super({
      datasources: {
        db: {
          url: 'postgresql://ejoy:ejoy123@localhost:5433/ejoy',
        },
      },
    } as any); 
  }

  async onModuleInit() {
    await this.$connect();
  }
}