import {
  Args,
  Context,
  ID,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { GraphQLBoolean, GraphQLString } from 'graphql';
import { ForbiddenException, Inject, Logger, UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CurrentUserRole } from '../auth/current-user-role.decorator';
import { CurrentUserScope } from '../auth/current-user-scope.decorator';
import { CurrentUserShopId } from '../auth/current-user-shop-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SensitiveActionVerificationInput } from '../auth/sensitive-action-verification.input';
import {
  AcceptDeliveryOrderInput,
  ApplyCouponInput,
  AddressInput,
  CancelOrderInput,
  ConfirmPaymentCallbackInput,
  CreateAddressInput,
  CreateOrderInput,
  DeliveryOrderFilterInput,
  DeliveryConfigInput,
  InitiatePaymentInput,
  MarkDeliveryOrderReadyInput,
  UpdateAddressInput,
} from './order.inputs';
import {
  CouponModel,
  CouponPreviewPayload,
  DeliveryCheckResultModel,
  MerchantDispatchOrderModel,
  MerchantOrderStatus,
  OrderDetailModel,
  OrderHistoryOrderModel,
  OrderModel,
  OrderPayload,
  PaymentPayload,
  ShopDeliveryConfigModel,
  ShopMenuProductModel,
  UserAddressModel,
} from './order.types';
import { OrderService } from './order.service';
import { TableModel } from '../table/table.types';

@Resolver()
export class OrderResolver {
  private readonly logger = new Logger(OrderResolver.name);

  constructor(
    private readonly orderService: OrderService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

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

  private assertManagerDeliveryWrite(
    role: string | undefined,
    scope: string[] | undefined,
  ): void {
    const r = role?.toLowerCase();
    const isAllowedRole =
      r === 'manager' || r === 'admin' || r === 'platform_admin';
    if (!isAllowedRole) {
      throw new ForbiddenException('Manager role required');
    }
    if (
      r !== 'admin' &&
      r !== 'platform_admin' &&
      !(scope ?? []).includes('delivery:write')
    ) {
      throw new ForbiddenException('Missing delivery:write scope');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Subscription(() => TableModel, {
    name: 'tableStatusChanged',
    filter: (
      payload: { tableStatusChanged?: { shopId?: string } },
      variables: { shopId: string },
    ) => payload.tableStatusChanged?.shopId === variables.shopId,
  })
  tableStatusChanged(@Args('shopId') shopId: string) {
    void shopId;
    return this.pubSub.asyncIterableIterator('tableStatusChanged');
  }

  @Query(() => String)
  orderHealth(): string {
    return 'ok';
  }

  /** 无需登录：顾客浏览门店菜单 */
  @Query(() => [ShopMenuProductModel])
  shopMenu(@Args('shopId') shopId: string): Promise<ShopMenuProductModel[]> {
    return this.orderService.shopMenuProducts(shopId);
  }

  /** MVP：顾客端历史订单列表（不按用户过滤） */
  @Query(() => [OrderHistoryOrderModel], { name: 'getOrders' })
  getOrders(
    @Args('ids', { type: () => [ID], nullable: true }) ids?: string[],
  ): Promise<OrderHistoryOrderModel[]> {
    return this.orderService.getOrdersForCustomer(ids ?? []);
  }

  /** 顾客端订单详情（按 id；不存在则返回 null） */
  @Query(() => OrderDetailModel, { nullable: true, name: 'getOrder' })
  getOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OrderDetailModel | null> {
    return this.orderService.getOrderByIdForCustomer(id);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [MerchantDispatchOrderModel], { name: 'merchantDispatchOrders' })
  merchantDispatchOrders(
    @Context()
    context: {
      req?: { user?: { shopId?: string; merchantId?: string; id?: string } };
    },
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<MerchantDispatchOrderModel[]> {
    const user = context.req?.user;
    console.log(
      'Incoming Merchant ID:',
      user?.merchantId ?? user?.shopId ?? '(none)',
      '| shopId arg:',
      shopId ?? '(none)',
      '| JWT shopId:',
      user?.shopId ?? '(none)',
    );
    this.assertMerchantDispatchAccess(role, scope, 'read');
    const effective = this.resolveMerchantShopId(shopId, currentShopId);
    console.log('Final Query Merchant ID:', user?.merchantId);
    console.log('Final Prisma shopId filter (Order.shopId):', effective);
    return this.orderService.merchantDispatchOrders(effective);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MerchantDispatchOrderModel, { name: 'updateOrderStatus' })
  updateOrderStatus(
    @Args('id') id: string,
    @Args('status', { type: () => MerchantOrderStatus })
    status: MerchantOrderStatus,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserId() userId?: string,
  ): Promise<MerchantDispatchOrderModel> {
    this.assertMerchantDispatchAccess(role, scope, 'write');
    const effective = this.resolveMerchantShopId(shopId, currentShopId);
    return this.orderService.updateMerchantOrderStatus(
      id,
      effective,
      status,
      userId,
    );
  }

  /** Demo / 战时：免 JWT，顾客身份固定 guest-001，便于先打通防超卖与落库 */
  @Mutation(() => OrderPayload)
  createOrder(
    @Args('input') input: CreateOrderInput,
    @CurrentUserId() userId?: string,
  ): Promise<OrderPayload> {
    return this.orderService.createOrder(input, userId ?? 'guest-001');
  }

  @Mutation(() => PaymentPayload)
  initiatePayment(
    @Args('input') input: InitiatePaymentInput,
  ): Promise<PaymentPayload> {
    return this.orderService.initiatePayment(input);
  }

  /**
   * Sandbox: returns a URL that simulates Telebirr redirect (see PaymentController GET).
   * Uses GraphQLString so code-first schema always registers this field (not TypeScript `String`).
   */
  @Mutation(() => GraphQLString, { name: 'initiateMockPayment' })
  async initiateMockPayment(
    @Args('orderId', { type: () => GraphQLString }) orderId: string,
  ): Promise<string> {
    const base =
      process.env.CUSTOMER_WEB_ORIGIN?.replace(/\/$/, '') ??
      process.env.VITE_CUSTOMER_WEB_URL?.replace(/\/$/, '') ??
      'http://localhost:9601';
    return `${base}/mock-telebirr?orderId=${encodeURIComponent(orderId)}`;
  }

  @Mutation(() => GraphQLBoolean, { name: 'confirmMockTelebirrPayment' })
  async confirmMockTelebirrPayment(
    @Args('orderId', { type: () => GraphQLString }) orderId: string,
  ): Promise<boolean> {
    const result = await this.orderService.applyMockPaymentSuccess(orderId);
    if (!result.ok) {
      throw new Error(result.error ?? 'Mock payment failed');
    }
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => CouponPreviewPayload)
  applyCoupon(
    @Args('input') input: ApplyCouponInput,
  ): Promise<CouponPreviewPayload> {
    return this.orderService.applyCoupon(input);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [CouponModel])
  availableCoupons(@Args('shopId') shopId: string): Promise<CouponModel[]> {
    return this.orderService.availableCoupons(shopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => OrderPayload)
  cancelOrder(
    @Args('input') input: CancelOrderInput,
    @CurrentUserId() userId?: string,
  ): Promise<OrderPayload> {
    return this.orderService.cancelOrder(input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [OrderModel])
  deliveryOrders(
    @Args('shopId') shopId: string,
    @Args('filters', { type: () => DeliveryOrderFilterInput, nullable: true })
    filters: DeliveryOrderFilterInput | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<OrderModel[]> {
    this.assertManagerDeliveryWrite(role, scope);
    if (currentShopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    return this.orderService.deliveryOrders(shopId, filters);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => OrderPayload)
  acceptDeliveryOrder(
    @Args('input') input: AcceptDeliveryOrderInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserId() userId?: string,
  ): Promise<OrderPayload> {
    this.assertManagerDeliveryWrite(role, scope);
    return this.orderService.acceptDeliveryOrder(input, currentShopId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => OrderPayload)
  markDeliveryOrderReady(
    @Args('input') input: MarkDeliveryOrderReadyInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserId() userId?: string,
  ): Promise<OrderPayload> {
    this.assertManagerDeliveryWrite(role, scope);
    return this.orderService.markDeliveryOrderReady(
      input,
      currentShopId,
      userId,
    );
  }

  @Mutation(() => OrderPayload)
  confirmPaymentCallback(
    @Args('input') input: ConfirmPaymentCallbackInput,
    @Context()
    ctx: {
      req?: {
        headers?: Record<string, string | string[] | undefined>;
        ip?: string;
      };
    },
  ): Promise<OrderPayload> {
    const rawRequestId = ctx.req?.headers?.['x-request-id'];
    const requestId = Array.isArray(rawRequestId)
      ? rawRequestId[0]
      : rawRequestId;
    const rawForwardedFor = ctx.req?.headers?.['x-forwarded-for'];
    const forwardedFor = Array.isArray(rawForwardedFor)
      ? rawForwardedFor[0]
      : rawForwardedFor;
    const sourceIp =
      forwardedFor?.split(',')[0]?.trim() || ctx.req?.ip || undefined;

    return this.orderService.confirmPaymentCallback(input, {
      requestId,
      sourceIp,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [UserAddressModel])
  myAddresses(@CurrentUserId() userId?: string): Promise<UserAddressModel[]> {
    return this.orderService.myAddresses(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserAddressModel)
  createAddress(
    @Args('input') input: CreateAddressInput,
    @CurrentUserId() userId?: string,
  ): Promise<UserAddressModel> {
    return this.orderService.createAddress(input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserAddressModel)
  updateAddress(
    @Args('addressId') addressId: string,
    @Args('input') input: UpdateAddressInput,
    @CurrentUserId() userId?: string,
  ): Promise<UserAddressModel> {
    return this.orderService.updateAddress(addressId, input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  deleteAddress(
    @Args('addressId') addressId: string,
    @CurrentUserId() userId?: string,
  ): Promise<boolean> {
    return this.orderService.deleteAddress(addressId, userId);
  }

  @Query(() => ShopDeliveryConfigModel)
  deliveryConfig(
    @Args('shopId') shopId: string,
  ): Promise<ShopDeliveryConfigModel> {
    return this.orderService.deliveryConfig(shopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ShopDeliveryConfigModel)
  updateDeliveryConfig(
    @Args('shopId') shopId: string,
    @Args('input') input: DeliveryConfigInput,
    @Args('verification') verification: SensitiveActionVerificationInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserId() userId?: string,
  ): Promise<ShopDeliveryConfigModel> {
    this.assertManagerDeliveryWrite(role, scope);
    if (currentShopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    this.assertSensitiveAction(verification);
    this.auditSensitiveAction('UPDATE_DELIVERY_CONFIG', {
      actorUserId: userId,
      shopId,
      reason: verification.reason,
    });
    return this.orderService.updateDeliveryConfig(shopId, input);
  }

  @Query(() => DeliveryCheckResultModel)
  checkDelivery(
    @Args('shopId') shopId: string,
    @Args('address') address: AddressInput,
  ): Promise<DeliveryCheckResultModel> {
    return this.orderService.checkDelivery(shopId, address);
  }

  private assertSensitiveAction(
    verification: SensitiveActionVerificationInput,
  ): void {
    const expected = process.env.ADMIN_SENSITIVE_OP_CODE?.trim();
    if (!expected) {
      throw new ForbiddenException(
        'Sensitive operation code is not configured',
      );
    }
    if (verification.code !== expected) {
      throw new ForbiddenException('Second verification failed');
    }
  }

  private auditSensitiveAction(
    action: string,
    meta: { actorUserId?: string; shopId?: string; reason?: string },
  ): void {
    this.logger.warn(
      JSON.stringify({
        event: 'sensitive_operation_audit',
        action,
        actorUserId: meta.actorUserId ?? 'unknown',
        shopId: meta.shopId ?? 'unknown',
        reason: meta.reason ?? null,
        at: new Date().toISOString(),
      }),
    );
  }
}
