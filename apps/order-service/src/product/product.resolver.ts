import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUserShopId } from '../auth/current-user-shop-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateProductInput, UpdateProductInput } from '../admin/admin.inputs';
import { ProductModel } from '../admin/admin.types';
import { ProductService } from './product.service';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  private resolveShopOrThrow(
    shopId: string | undefined,
    currentShopId: string | undefined,
  ): string {
    const effectiveShopId = shopId ?? currentShopId;
    if (!effectiveShopId) {
      throw new ForbiddenException('Shop context is required');
    }
    if (currentShopId && shopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    return effectiveShopId;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'platform_admin')
  @Mutation(() => ProductModel)
  createProduct(
    @Args('shopId') shopId: string,
    @Args('input') input: CreateProductInput,
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<ProductModel> {
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.productService.createProduct(effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'platform_admin')
  @Mutation(() => ProductModel, { nullable: true })
  updateProduct(
    @Args('productId') productId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('input') input: UpdateProductInput,
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<ProductModel | null> {
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.productService.updateProduct(productId, effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'platform_admin')
  @Mutation(() => ProductModel)
  archiveProduct(
    @Args('productId') productId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<ProductModel> {
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.productService.archiveProduct(productId, effectiveShopId);
  }
}
