import { Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { ShopModel } from './shop.types';

@Resolver()
export class ShopResolver {
  constructor(private readonly prisma: PrismaService) {}

  /** 仅返回仍营业的店铺；兼容 Prisma 客户端字段与 GraphQL 模型对齐 */
  @Query(() => [ShopModel])
  async shops(): Promise<ShopModel[]> {
    const rows = await this.prisma.shop.findMany({
      orderBy: { name: 'asc' },
    });
    return rows
      .filter((r) => (r as { active?: boolean }).active !== false)
      .map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        contactPhone: r.contactPhone ?? undefined,
        logoUrl: r.logoUrl ?? undefined,
        active: (r as { active?: boolean }).active ?? true,
      }));
  }
}
