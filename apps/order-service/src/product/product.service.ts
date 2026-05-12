import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput, UpdateProductInput } from '../admin/admin.inputs';
import { ProductModel, ProductStatusModel } from '../admin/admin.types';

/** Matches Prisma `ProductStatus` after migrate + `prisma generate`. */
const PS = { ACTIVE: 'ACTIVE', ARCHIVED: 'ARCHIVED' } as const;

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private toProductModel(row: {
    id: string;
    shopId: string;
    name: string;
    category: string | null;
    unitPrice: number;
    imageUrl: string | null;
    active: boolean;
    status?: string;
  }): ProductModel {
    const st = (row.status ?? PS.ACTIVE) as ProductStatusModel;
    return {
      id: row.id,
      shopId: row.shopId,
      name: row.name,
      category: typeof row.category === 'string' ? row.category : 'General',
      unitPrice: row.unitPrice,
      imageUrl: row.imageUrl ?? undefined,
      active: row.active,
      status: st,
    };
  }

  /**
   * List products for merchant console. By default excludes archived rows.
   */
  async listProducts(shopId: string, category?: string): Promise<ProductModel[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        shopId,
        status: PS.ACTIVE,
        ...(category ? { category } : {}),
      } as Record<string, unknown>,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return rows.map((row) => this.toProductModel(row as never));
  }

  /**
   * Create product: unitPrice in integer cents; duplicate name per shop blocked among ACTIVE rows.
   */
  async createProduct(
    shopId: string,
    input: CreateProductInput,
  ): Promise<ProductModel> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException(`Shop not found: ${shopId}`);
    }

    const raw = Number(input.unitPrice);
    if (!Number.isFinite(raw) || raw < 0 || !Number.isInteger(raw)) {
      throw new BadRequestException(
        'unitPrice must be a non-negative integer (cents)',
      );
    }
    const unitPriceCents = raw;

    const name = input.name.trim();
    const category = input.category.trim();
    if (!name || !category) {
      throw new BadRequestException('name and category are required');
    }

    const dup = await this.prisma.product.findFirst({
      where: {
        shopId,
        name,
        status: PS.ACTIVE,
      } as Record<string, unknown>,
    });
    if (dup) {
      throw new ConflictException(
        'Product with this name already exists in this shop',
      );
    }

    const imageUrl =
      typeof input.imageUrl === 'string' && input.imageUrl.trim() !== ''
        ? input.imageUrl.trim()
        : undefined;

    const row = await this.prisma.product.create({
      data: {
        shopId,
        name,
        category,
        unitPrice: unitPriceCents,
        imageUrl,
        active: input.active ?? true,
        status: PS.ACTIVE,
      } as never,
    });

    return this.toProductModel(row);
  }

  /**
   * Update fields on an ACTIVE product; name must not duplicate another ACTIVE product in the shop.
   */
  async updateProduct(
    productId: string,
    shopId: string,
    input: UpdateProductInput,
  ): Promise<ProductModel | null> {
    const current = await this.prisma.product.findFirst({
      where: { id: productId, shopId },
    });
    if (!current) {
      return null;
    }
    const curStatus = (current as { status?: string }).status ?? PS.ACTIVE;
    if (curStatus === PS.ARCHIVED) {
      throw new BadRequestException('Cannot update an archived product');
    }

    if (input.name !== undefined) {
      const nextName = input.name.trim();
      if (!nextName) {
        throw new BadRequestException('name cannot be empty');
      }
      if (nextName !== current.name) {
        const conflict = await this.prisma.product.findFirst({
          where: {
            shopId,
            name: nextName,
            status: PS.ACTIVE,
            NOT: { id: productId },
          } as Record<string, unknown>,
        });
        if (conflict) {
          throw new ConflictException(
            'Product with this name already exists in this shop',
          );
        }
      }
    }

    await this.prisma.product.updateMany({
      where: { id: productId, shopId, status: PS.ACTIVE } as Record<
        string,
        unknown
      >,
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.unitPrice !== undefined
          ? { unitPrice: input.unitPrice }
          : {}),
        ...(input.imageUrl !== undefined
          ? {
              imageUrl:
                input.imageUrl.trim() === '' ? null : input.imageUrl.trim(),
            }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    const row = await this.prisma.product.findFirst({
      where: { id: productId, shopId },
    });
    if (!row) return null;
    return this.toProductModel(row);
  }

  /**
   * Soft-delete: marks product ARCHIVED (no physical delete; order history preserved).
   */
  async archiveProduct(productId: string, shopId: string): Promise<ProductModel> {
    const current = await this.prisma.product.findFirst({
      where: { id: productId, shopId },
    });
    if (!current) {
      throw new NotFoundException('Product not found');
    }
    const curStatus = (current as { status?: string }).status ?? PS.ACTIVE;
    if (curStatus === PS.ARCHIVED) {
      return this.toProductModel(current as never);
    }

    const row = await this.prisma.product.update({
      where: { id: productId },
      data: { status: PS.ARCHIVED } as never,
    });
    return this.toProductModel(row);
  }
}
