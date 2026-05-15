import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import type { Response } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthTokenService } from '../auth/auth-token.service';
import {
  clearRefreshCookie,
  readCookie,
  setRefreshCookie,
} from '../auth/cookie.util';
import { getAuthConfig } from '../auth/auth-config';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { CurrentUserRole } from '../auth/current-user-role.decorator';
import { CurrentUserShopId } from '../auth/current-user-shop-id.decorator';
import { CurrentUserScope } from '../auth/current-user-scope.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimitService } from '../auth/rate-limit.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from '../admin/admin.service';
import { AppLoggerService } from '../ops/app-logger.service';
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
  ChangePasswordInput,
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
    private readonly realtimeService: RealtimeService,
    private readonly adminService: AdminService,
    private readonly authSessions: AuthSessionService,
    private readonly authTokens: AuthTokenService,
    private readonly rateLimit: RateLimitService,
    private readonly appLogger: AppLoggerService,
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
    @Context()
    ctx: {
      req?: {
        headers?: Record<string, string | string[] | undefined>;
        ip?: string;
      };
      res?: Response;
    },
  ): Promise<AuthPayloadModel> {
    const normalizedPhone = phone.trim();
    this.rateLimit.consume({
      key: `${this.rateLimit.getClientIp(ctx.req)}:${normalizedPhone}`,
      label: 'staff_login',
      limit: 5,
      windowMs: 60_000,
    });
    if (!normalizedPhone || !password.trim()) {
      this.appLogger.warn('auth.login.failed', {
        subjectType: 'STAFF',
        identifier: normalizedPhone,
        reason: 'missing_credentials',
        ip: this.rateLimit.getClientIp(ctx.req),
      });
      throw new UnauthorizedException('Invalid phone or password');
    }
    const staff = await this.staffService.authenticateStaff(
      normalizedPhone,
      password,
    );
    if (!staff) {
      this.appLogger.warn('auth.login.failed', {
        subjectType: 'STAFF',
        identifier: normalizedPhone,
        reason: 'invalid_credentials',
        ip: this.rateLimit.getClientIp(ctx.req),
      });
      throw new UnauthorizedException('Invalid phone or password');
    }
    const role = String(staff.role);
    const scope = this.scopesForStaffRole(role);
    const jwtRole = this.jwtRoleForStaffRole(role);
    const shopId = String(staff.shopId);
    const session = await this.authSessions.createSession({
      subjectType: 'STAFF',
      subjectId: String(staff.id),
      userAgent: String(ctx.req?.headers?.['user-agent'] ?? ''),
      ip: this.rateLimit.getClientIp(ctx.req),
    });
    const signed = this.authTokens.signAccessToken(
      {
        id: String(staff.id),
        subjectType: 'STAFF',
        role: jwtRole,
        shopId,
        scope,
      },
      session.sessionId,
    );
    setRefreshCookie(ctx.res, session.refreshToken);
    this.appLogger.info('auth.login.success', {
      subjectType: 'STAFF',
      subjectId: String(staff.id),
      shopId,
      role: jwtRole,
    });
    return {
      accessToken: signed.accessToken,
      expiresAt: signed.expiresAt,
      role: jwtRole,
      shopId,
      scope,
    };
  }

  @Mutation(() => AuthPayloadModel)
  async refreshSession(
    @Context()
    ctx: {
      req?: {
        headers?: Record<string, string | string[] | undefined>;
        ip?: string;
      };
      res?: Response;
    },
  ): Promise<AuthPayloadModel> {
    const cfg = getAuthConfig();
    const refreshToken = readCookie(ctx.req, cfg.refreshCookieName);
    this.rateLimit.consume({
      key: `${this.rateLimit.getClientIp(ctx.req)}:${refreshToken ?? 'none'}`,
      label: 'refresh_session',
      limit: 20,
      windowMs: 60_000,
    });
    if (!refreshToken) {
      this.appLogger.warn('auth.refresh.failed', { reason: 'missing_cookie' });
      throw new UnauthorizedException('Login required');
    }
    let rotated: Awaited<ReturnType<AuthSessionService['rotateRefreshToken']>>;
    try {
      rotated = await this.authSessions.rotateRefreshToken(refreshToken);
    } catch (err) {
      this.appLogger.warn('auth.refresh.failed', {
        reason: err instanceof Error ? err.message : 'invalid_refresh',
      });
      throw err;
    }
    if (rotated.session.subjectType === 'STAFF') {
      const staff = await this.staffService.staffActor(
        rotated.session.subjectId,
      );
      if (!staff) {
        await this.authSessions.revokeSession(
          rotated.session.id,
          'staff_inactive',
        );
        this.appLogger.warn('auth.refresh.failed', {
          subjectType: 'STAFF',
          subjectId: rotated.session.subjectId,
          reason: 'staff_inactive',
        });
        throw new UnauthorizedException('Session is no longer valid');
      }
      const role = String(staff.role);
      const jwtRole = this.jwtRoleForStaffRole(role);
      const signed = this.authTokens.signAccessToken(
        {
          id: String(staff.id),
          subjectType: 'STAFF',
          role: jwtRole,
          shopId: String(staff.shopId),
          scope: this.scopesForStaffRole(role),
        },
        rotated.session.id,
      );
      setRefreshCookie(ctx.res, rotated.refreshToken);
      this.appLogger.info('auth.refresh.success', {
        subjectType: 'STAFF',
        subjectId: String(staff.id),
        shopId: String(staff.shopId),
      });
      return {
        accessToken: signed.accessToken,
        expiresAt: signed.expiresAt,
        role: jwtRole,
        shopId: String(staff.shopId),
        scope: this.scopesForStaffRole(role),
      };
    }
    const admin = await this.adminService.platformMe(rotated.session.subjectId);
    if (!admin) {
      await this.authSessions.revokeSession(
        rotated.session.id,
        'platform_admin_inactive',
      );
      this.appLogger.warn('auth.refresh.failed', {
        subjectType: 'PLATFORM_ADMIN',
        subjectId: rotated.session.subjectId,
        reason: 'platform_admin_inactive',
      });
      throw new UnauthorizedException('Session is no longer valid');
    }
    const scope = this.adminService.platformScopes(String(admin.role));
    const signed = this.authTokens.signAccessToken(
      {
        id: String(admin.id),
        subjectType: 'PLATFORM_ADMIN',
        role: 'platform_admin',
        platformRole: String(admin.role),
        scope,
      },
      rotated.session.id,
    );
    setRefreshCookie(ctx.res, rotated.refreshToken);
    this.appLogger.info('auth.refresh.success', {
      subjectType: 'PLATFORM_ADMIN',
      subjectId: String(admin.id),
      role: String(admin.role),
    });
    return {
      accessToken: signed.accessToken,
      expiresAt: signed.expiresAt,
      role: 'platform_admin',
      scope,
    };
  }

  @Mutation(() => Boolean)
  async logout(
    @Context()
    ctx: {
      req?: { headers?: Record<string, string | string[] | undefined> };
      res?: Response;
    },
  ): Promise<boolean> {
    const cfg = getAuthConfig();
    const refreshToken = readCookie(ctx.req, cfg.refreshCookieName);
    const sessionId = refreshToken
      ? this.authSessions.parseSessionId(refreshToken)
      : undefined;
    if (sessionId) {
      await this.authSessions.revokeSession(sessionId, 'logout');
    }
    clearRefreshCookie(ctx.res);
    this.appLogger.info('auth.logout', { sessionId: sessionId ?? 'unknown' });
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async logoutAllSessions(
    @CurrentUserId() userId?: string,
    @Context()
    ctx?: {
      req?: {
        user?: { subjectType?: 'STAFF' | 'PLATFORM_ADMIN' };
      };
      res?: Response;
    },
  ): Promise<boolean> {
    if (userId && ctx?.req?.user?.subjectType) {
      await this.authSessions.revokeSubject(
        ctx.req.user.subjectType,
        userId,
        'logout_all',
      );
      this.appLogger.info('auth.logout_all', {
        subjectType: ctx.req.user.subjectType,
        subjectId: userId,
      });
    }
    clearRefreshCookie(ctx?.res);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @CurrentUserId() userId?: string,
    @Context()
    ctx?: {
      req?: {
        user?: { subjectType?: 'STAFF' | 'PLATFORM_ADMIN' };
      };
      res?: Response;
    },
  ): Promise<boolean> {
    if (!userId || !ctx?.req?.user?.subjectType) {
      throw new UnauthorizedException('Login required');
    }
    this.rateLimit.consume({
      key: `${ctx.req.user.subjectType}:${userId}`,
      label: 'change_password',
      limit: 3,
      windowMs: 10 * 60_000,
    });
    const ok =
      ctx.req.user.subjectType === 'STAFF'
        ? await this.staffService.changePassword(
            userId,
            input.currentPassword,
            input.newPassword,
          )
        : await this.adminService.changePlatformPassword(
            userId,
            input.currentPassword,
            input.newPassword,
          );
    clearRefreshCookie(ctx.res);
    if (!ok) {
      throw new UnauthorizedException('Invalid current password');
    }
    this.appLogger.info('auth.password_changed', {
      subjectType: ctx.req.user.subjectType,
      subjectId: userId,
    });
    return true;
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
