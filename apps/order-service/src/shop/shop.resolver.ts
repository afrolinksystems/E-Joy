import { Args, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { ShopModel } from './shop.types';

@Resolver()
export class ShopResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [ShopModel])
  async shops(): Promise<ShopModel[]> {
    const rows: ShopRow[] = await (this.prisma.shop as any).findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        contactPhone: true,
        logoUrl: true,
        customerThemePreset: true,
        customerThemeOverridesJson: true,
        active: true,
      },
    });
    return rows
      .filter((r) => (r as { active?: boolean }).active !== false)
      .map((r) => this.toShopModel(r));
  }

  @Query(() => ShopModel, { nullable: true })
  async customerShop(
    @Args('shopId') shopId: string,
  ): Promise<ShopModel | null> {
    const row = await (this.prisma.shop as any).findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        description: true,
        contactPhone: true,
        logoUrl: true,
        customerThemePreset: true,
        customerThemeOverridesJson: true,
        active: true,
      },
    });
    if (!row || row.active === false) {
      return null;
    }
    return this.toShopModel(row);
  }

  private toShopModel(row: ShopRow): ShopModel {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      contactPhone: row.contactPhone ?? undefined,
      logoUrl: row.logoUrl ?? undefined,
      customerThemePreset: row.customerThemePreset ?? undefined,
      customerThemeOverrides: this.parseCustomerThemeOverrides(
        row.customerThemeOverridesJson,
      ),
      active: row.active,
    };
  }

  private parseCustomerThemeOverrides(
    raw: string | null,
  ): ShopModel['customerThemeOverrides'] {
    if (!raw?.trim()) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as ShopModel['customerThemeOverrides'];
    } catch {
      return undefined;
    }
  }
}

type ShopRow = {
  id: string;
  name: string;
  description: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  customerThemePreset: string | null;
  customerThemeOverridesJson: string | null;
  active: boolean;
};
