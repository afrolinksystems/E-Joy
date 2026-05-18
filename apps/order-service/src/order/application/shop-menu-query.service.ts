import { Injectable } from '@nestjs/common';
import type { Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ShopMenuProductModel } from '../order.types';

@Injectable()
export class ShopMenuQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async shopMenuProducts(shopId: string): Promise<ShopMenuProductModel[]> {
    const rows = await this.prisma.product.findMany({
      where: { shopId, active: true, status: 'ACTIVE' } as Record<
        string,
        unknown
      >,
      orderBy: { name: 'asc' },
      take: 500,
    });
    return rows.map((row) => this.toShopMenuProduct(row));
  }

  private toShopMenuProduct(
    row: Product & { category?: string; imageUrl?: string | null },
  ): ShopMenuProductModel {
    return {
      id: row.id,
      name: row.name,
      category: typeof row.category === 'string' ? row.category : 'General',
      unitPrice: row.unitPrice,
      imageUrl:
        typeof row.imageUrl === 'string' && row.imageUrl.length > 0
          ? row.imageUrl
          : undefined,
    };
  }
}
