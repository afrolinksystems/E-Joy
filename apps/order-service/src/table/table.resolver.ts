import { Args, Float, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { CurrentUserRole } from '../auth/current-user-role.decorator';
import { CurrentUserScope } from '../auth/current-user-scope.decorator';
import { CurrentUserShopId } from '../auth/current-user-shop-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TablePositionInput } from './table.inputs';
import { TableModel } from './table.types';
import { TableService } from './table.service';

@Resolver()
export class TableResolver {
  constructor(private readonly tableService: TableService) {}

  private assertMerchantDispatchAccess(
    role: string | undefined,
    scope: string[] | undefined,
    mode: 'read' | 'write',
  ): void {
    const r = role?.toLowerCase();
    const allowed =
      r === 'staff' ||
      r === 'manager' ||
      r === 'admin' ||
      r === 'platform_admin';
    if (!allowed) {
      throw new ForbiddenException('Merchant access required');
    }
    if (r === 'admin' || r === 'platform_admin') {
      return;
    }
    const need = mode === 'read' ? 'staff:read' : 'staff:write';
    if (!(scope ?? []).includes(need)) {
      throw new ForbiddenException(`Missing ${need} scope`);
    }
  }

  private resolveMerchantShopId(
    shopId: string | undefined,
    currentShopId: string | undefined,
  ): string {
    const effective = shopId ?? currentShopId;
    if (!effective) {
      throw new ForbiddenException('Shop context is required');
    }
    if (currentShopId && shopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    return effective;
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [TableModel], { name: 'getTables' })
  getTables(
    @Args('shopId') shopIdArg: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<TableModel[]> {
    this.assertMerchantDispatchAccess(role, scope, 'read');
    const shopId = this.resolveMerchantShopId(shopIdArg, currentShopId);
    return this.tableService.getTables(shopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => [TableModel], { name: 'updateTablePositions' })
  updateTablePositions(
    @Args('input', { type: () => [TablePositionInput] }) input: TablePositionInput[],
    @Args('shopId', { type: () => String, nullable: true }) shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<TableModel[]> {
    this.assertMerchantDispatchAccess(role, scope, 'write');
    const effectiveShopId = this.resolveMerchantShopId(shopId, currentShopId);
    return this.tableService.updateTablePositions(effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => TableModel, { name: 'updateTable' })
  updateTable(
    @Args('id') id: string,
    @Args('tableNumber') tableNumber: string,
    @Args('capacity', { type: () => Int, nullable: true }) capacity: number | undefined | null,
    @Args('shopId', { type: () => String, nullable: true }) shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<TableModel> {
    this.assertMerchantDispatchAccess(role, scope, 'write');
    const effectiveShopId = this.resolveMerchantShopId(shopId, currentShopId);
    return this.tableService.updateTable(effectiveShopId, id, tableNumber, capacity);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, { name: 'deleteTable' })
  deleteTable(
    @Args('id') id: string,
    @Args('shopId', { type: () => String, nullable: true }) shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<boolean> {
    this.assertMerchantDispatchAccess(role, scope, 'write');
    const effectiveShopId = this.resolveMerchantShopId(shopId, currentShopId);
    return this.tableService.deleteTable(effectiveShopId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => TableModel, { name: 'createTable' })
  createTable(
    @Args('shopId', { type: () => String, nullable: true }) shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<TableModel> {
    this.assertMerchantDispatchAccess(role, scope, 'write');
    const effectiveShopId = this.resolveMerchantShopId(shopId, currentShopId);
    return this.tableService.createTable(effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => TableModel, { name: 'updateTablePosition' })
  updateTablePosition(
    @Args('id') id: string,
    @Args('x', { type: () => Float }) x: number,
    @Args('y', { type: () => Float }) y: number,
    @Args('shopId', { type: () => String, nullable: true }) shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<TableModel> {
    this.assertMerchantDispatchAccess(role, scope, 'write');
    const effectiveShopId = this.resolveMerchantShopId(shopId, currentShopId);
    return this.tableService.updateTablePosition(id, effectiveShopId, x, y);
  }
}
