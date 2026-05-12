import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CurrentUserRole } from '../auth/current-user-role.decorator';
import { CurrentUserShopId } from '../auth/current-user-shop-id.decorator';
import { CurrentUserScope } from '../auth/current-user-scope.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { REALTIME_TOPICS, RealtimeService } from '../realtime/realtime.service';
import { StaffService } from './staff.service';
import {
  AuthPayloadModel,
  StaffNotificationModel,
  MerchantMeModel,
  StaffPerformanceModel,
  StaffPromotionCodeModel,
  StaffPromotionStatsModel,
  ServiceTicketModel,
  StaffPrintJobModel,
  StaffUserModel,
} from './staff.types';
import {
  AcceptServiceTicketInput,
  CallWaiterInput,
  CreateStaffAccountInput,
  MarkStaffNotificationReadInput,
  ResolveServiceTicketInput,
  StaffNotificationFilterInput,
  StaffPerformanceRangeInput,
  UpdateServiceTicketStatusInput,
  UpdateStaffRoleInput,
} from './staff.inputs';

@Resolver()
export class StaffResolver {
  constructor(
    private readonly staffService: StaffService,
    private readonly jwtService: JwtService,
    private readonly realtimeService: RealtimeService,
  ) {}

  private assertRole(
    role: string | undefined,
    allowedRoles: Array<
      'customer' | 'staff' | 'manager' | 'admin' | 'platform_admin'
    >,
  ): void {
    if (!role || !allowedRoles.includes(role as never)) {
      throw new ForbiddenException('Insufficient role permissions');
    }
  }

  /** Platform admins may query any shop; shop-bound users must match `shopId`. */
  private assertShopScope(
    role: string | undefined,
    requestedShopId: string,
    currentShopId?: string,
  ): void {
    const r = role?.toLowerCase();
    if (r === 'admin' || r === 'platform_admin') {
      return;
    }
    if (!currentShopId || currentShopId !== requestedShopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
  }

  private scopesForStaffRole(role: string): string[] {
    const r = role.toUpperCase();
    if (r === 'MANAGER') {
      return [
        'staff:read',
        'staff:write',
        'ticket:read',
        'ticket:write',
        'printer:read',
        'printer:write',
        'delivery:write',
      ];
    }
    if (r === 'CASHIER') {
      return ['staff:read', 'ticket:read', 'ticket:write', 'printer:read'];
    }
    if (r === 'KITCHEN') {
      return ['staff:read', 'ticket:read', 'printer:read', 'printer:write'];
    }
    return ['ticket:read', 'ticket:write'];
  }

  private jwtRoleForStaffRole(role: string): 'staff' | 'manager' {
    return role.toUpperCase() === 'MANAGER' ? 'manager' : 'staff';
  }

  /** Manager / platform_admin only. Passwords for new staff are bcrypt-hashed in `StaffService`. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'platform_admin')
  @Query(() => [StaffUserModel])
  getStaffList(
    @Args('shopId') shopId: string,
    @CurrentUserRole() role?: string,
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffUserModel[]> {
    this.assertShopScope(role, shopId, currentShopId);
    return this.staffService.getStaffList(shopId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'platform_admin')
  @Mutation(() => StaffUserModel)
  createStaffAccount(
    @Args('input') input: CreateStaffAccountInput,
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffUserModel> {
    if (!currentShopId) {
      throw new ForbiddenException('Shop context is required to create staff');
    }
    return this.staffService.createStaffAccount(currentShopId, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'platform_admin')
  @Mutation(() => StaffUserModel)
  updateStaffRole(
    @Args('input') input: UpdateStaffRoleInput,
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffUserModel> {
    if (!currentShopId) {
      throw new ForbiddenException('Shop context is required');
    }
    return this.staffService.updateStaffRole(currentShopId, input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'platform_admin')
  @Mutation(() => Boolean)
  deleteStaffUser(
    @Args('userId') userId: string,
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<boolean> {
    if (!currentShopId) {
      throw new ForbiddenException('Shop context is required');
    }
    return this.staffService.deleteStaffUser(currentShopId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ServiceTicketModel)
  callWaiter(
    @Args('input') input: CallWaiterInput,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserShopId() shopId?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ServiceTicketModel> {
    this.assertRole(role, ['customer', 'admin', 'platform_admin']);
    if (shopId && shopId !== input.shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    if (role !== 'customer' && !(scope ?? []).includes('ticket:write')) {
      throw new ForbiddenException('Missing ticket:write scope');
    }
    return this.staffService.callWaiter(input, userId ?? 'anonymous_user');
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ServiceTicketModel])
  serviceTickets(
    @Args('shopId', { nullable: true }) shopId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ServiceTicketModel[]> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:read') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:read scope');
    }
    if (currentShopId && shopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    return this.staffService.listServiceTickets(shopId ?? currentShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ServiceTicketModel, { nullable: true })
  updateServiceTicketStatus(
    @Args('input') input: UpdateServiceTicketStatusInput,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ServiceTicketModel | null> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:write') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:write scope');
    }
    return this.staffService.updateServiceTicketStatus(
      input,
      userId ?? 'anonymous_staff',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ServiceTicketModel, { nullable: true })
  acceptServiceTicket(
    @Args('input') input: AcceptServiceTicketInput,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ServiceTicketModel | null> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:write') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:write scope');
    }
    return this.staffService.acceptServiceTicket(
      input,
      userId ?? 'anonymous_staff',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ServiceTicketModel, { nullable: true })
  resolveServiceTicket(
    @Args('input') input: ResolveServiceTicketInput,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ServiceTicketModel | null> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:write') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:write scope');
    }
    return this.staffService.resolveServiceTicket(
      input,
      userId ?? 'anonymous_staff',
    );
  }

  @Mutation(() => AuthPayloadModel)
  async staffLogin(
    @Args('phone') phone: string,
    @Args('password') password: string,
  ): Promise<AuthPayloadModel> {
    if (!phone.trim() || !password.trim()) {
      throw new ForbiddenException('Phone and password are required');
    }
    const staff = await this.staffService.authenticateStaff(phone, password);
    if (!staff) {
      throw new UnauthorizedException('Invalid phone or password');
    }
    const role = String(staff.role);
    const scope = this.scopesForStaffRole(role);
    const jwtRole = this.jwtRoleForStaffRole(role);
    const shopId = String(staff.shopId);
    const accessToken = this.jwtService.sign({
      sub: String(staff.id),
      role: jwtRole,
      staffRole: role,
      shopId,
      scope,
    });
    return { accessToken, role: jwtRole, shopId, scope };
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => MerchantMeModel)
  async merchantMe(
    @CurrentUserId() userId?: string,
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<MerchantMeModel> {
    if (!userId) {
      throw new UnauthorizedException('Login required');
    }
    const result = await this.staffService.merchantMe(userId);
    if (!result || String(result.staff.shopId) !== currentShopId) {
      throw new UnauthorizedException('Staff session is no longer valid');
    }
    return {
      id: String(result.staff.id),
      name: String(result.staff.name),
      phone: String(result.staff.phone),
      role: String(result.staff.role),
      shopId: String(result.staff.shopId),
      scope: scope ?? [],
      shop: {
        id: String(result.shop.id),
        name: String(result.shop.name),
        logoUrl:
          typeof result.shop.logoUrl === 'string'
            ? result.shop.logoUrl
            : undefined,
        active: Boolean(result.shop.active),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ServiceTicketModel])
  myCalls(@CurrentUserRole() role?: string): Promise<ServiceTicketModel[]> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    return this.staffService.listServiceTickets();
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => String)
  serviceTicketFeedVersion(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<string> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:read') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:read scope');
    }
    if (currentShopId && shopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    return this.staffService.serviceTicketFeedVersion(shopId ?? currentShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ServiceTicketModel, { nullable: true })
  respondCall(
    @Args('callId') callId: string,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ServiceTicketModel | null> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:write') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:write scope');
    }
    return this.staffService.acceptServiceTicket(
      { ticketId: callId },
      userId ?? 'anonymous_staff',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => StaffPrintJobModel)
  async reprintOrder(
    @Args('orderId') orderId: string,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserShopId() shopId?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<StaffPrintJobModel> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('printer:write') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing printer:write scope');
    }
    try {
      return await this.staffService.reprintOrder(
        orderId,
        userId ?? 'anonymous_staff',
        shopId,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'REPRINT_FAILED';
      throw new BadRequestException(message);
    }
  }

  @Subscription(() => ServiceTicketModel)
  serviceTicketUpdated() {
    return this.realtimeService.asyncIterator(
      REALTIME_TOPICS.serviceTicketUpdated,
    );
  }

  @Subscription(() => StaffPrintJobModel)
  printJobUpdated() {
    return this.realtimeService.asyncIterator(REALTIME_TOPICS.printJobUpdated);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [StaffNotificationModel])
  myNotifications(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('filters', {
      type: () => StaffNotificationFilterInput,
      nullable: true,
    })
    filters: StaffNotificationFilterInput | undefined,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffNotificationModel[]> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:read') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:read scope');
    }
    if (currentShopId && shopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    return this.staffService.myNotifications(
      userId ?? 'anonymous_staff',
      shopId ?? currentShopId,
      filters,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  markStaffNotificationRead(
    @Args('input') input: MarkStaffNotificationReadInput,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<boolean> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:write') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:write scope');
    }
    return this.staffService.markNotificationRead(
      input,
      userId ?? 'anonymous_staff',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => StaffNotificationModel)
  pushStaffAnnouncement(
    @Args('shopId') shopId: string,
    @Args('title') title: string,
    @Args('content') content: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffNotificationModel> {
    this.assertRole(role, ['manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:write') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:write scope');
    }
    if (currentShopId && currentShopId !== shopId) {
      throw new ForbiddenException('Shop scope mismatch');
    }
    return this.staffService.pushAnnouncement(shopId, title, content);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => StaffPerformanceModel)
  myPerformance(
    @Args('range', { type: () => StaffPerformanceRangeInput })
    range: StaffPerformanceRangeInput,
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffPerformanceModel> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:read') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:read scope');
    }
    return this.staffService.myPerformance(
      userId ?? 'anonymous_staff',
      range,
      currentShopId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => StaffPromotionCodeModel)
  myPromotionCode(
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffPromotionCodeModel> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:read') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:read scope');
    }
    return this.staffService.myPromotionCode(
      userId ?? 'anonymous_staff',
      currentShopId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => StaffPromotionStatsModel)
  myPromotionStats(
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<StaffPromotionStatsModel> {
    this.assertRole(role, ['staff', 'manager', 'admin', 'platform_admin']);
    if (
      !(scope ?? []).includes('ticket:read') &&
      role !== 'admin' &&
      role !== 'platform_admin'
    ) {
      throw new ForbiddenException('Missing ticket:read scope');
    }
    return this.staffService.myPromotionStats(userId ?? 'anonymous_staff');
  }
}
