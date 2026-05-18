import {
  ForbiddenException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Response } from 'express';
import { AuthSessionService } from '../auth/auth-session.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { RateLimitService } from '../auth/rate-limit.service';
import { setRefreshCookie } from '../auth/cookie.util';
import { CurrentUserRole } from '../auth/current-user-role.decorator';
import { CurrentUserShopId } from '../auth/current-user-shop-id.decorator';
import { CurrentUserScope } from '../auth/current-user-scope.decorator';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SensitiveActionVerificationInput } from '../auth/sensitive-action-verification.input';
import { AdminService } from './admin.service';
import {
  AdminDashboardModel,
  ApplicationStatusModel,
  ApproveShopApplicationPayload,
  BannerModel,
  BannerStatusModel,
  BusinessReportModel,
  DashboardMetricsModel,
  ExportPayloadModel,
  ManagedShopModel,
  ManagedShopDetailModel,
  PlatformAuthPayloadModel,
  PlatformAdminRoleModel,
  PlatformAuditLogModel,
  PlatformDashboardModel,
  PlatformMeModel,
  ProductModel,
  PlatformCouponModel,
  PlatformCouponStatusModel,
  PerformanceRuleModel,
  PromotionStatsByStaffModel,
  PrintJobModel,
  PrintRetryCycleResultModel,
  PrinterModel,
  ResetPasswordPayload,
  ShopPaymentConfigModel,
  StaffModel,
  StaffStatusModel,
  ShopApplicationModel,
} from './admin.types';
import {
  CreateBannerInput,
  ApproveShopApplicationInput,
  CreateShopApplicationInput,
  CreatePlatformCouponInput,
  ManagedShopsFilterInput,
  PlatformAuditLogFilterInput,
  CreatePrinterInput,
  CreateStaffInput,
  ReportRangeInput,
  UpdatePerformanceRuleInput,
  UpdatePrinterInput,
  UpdateStaffInput,
  UpdateManagedShopInput,
  UpdateShopPaymentConfigInput,
  UpdateShopInput,
} from './admin.inputs';
import { ShopModel } from '../shop/shop.types';
import { AppLoggerService } from '../ops/app-logger.service';

@Resolver()
export class AdminResolver {
  constructor(
    private readonly adminService: AdminService,
    private readonly authSessions: AuthSessionService,
    private readonly authTokens: AuthTokenService,
    private readonly rateLimit: RateLimitService,
    private readonly appLogger: AppLoggerService,
  ) {}

  private assertManagerAccess(
    role: string | undefined,
    scope: string[] | undefined,
    requiredScope: string,
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
      !(scope ?? []).includes(requiredScope)
    ) {
      throw new ForbiddenException(`Missing ${requiredScope} scope`);
    }
  }

  @Mutation(() => PlatformAuthPayloadModel)
  async platformLogin(
    @Args('identifier') identifier: string,
    @Args('password') password: string,
    @Context()
    ctx: {
      req?: {
        headers?: Record<string, string | string[] | undefined>;
        ip?: string;
      };
      res?: Response;
    },
  ): Promise<PlatformAuthPayloadModel> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    this.rateLimit.consume({
      key: `${this.rateLimit.getClientIp(ctx.req)}:${normalizedIdentifier}`,
      label: 'platform_login',
      limit: 5,
      windowMs: 60_000,
    });
    if (!normalizedIdentifier || !password.trim()) {
      this.appLogger.warn('auth.login.failed', {
        subjectType: 'PLATFORM_ADMIN',
        identifier: normalizedIdentifier,
        reason: 'missing_credentials',
        ip: this.rateLimit.getClientIp(ctx.req),
      });
      throw new UnauthorizedException('Invalid identifier or password');
    }
    const admin = await this.adminService.authenticatePlatformAdmin(
      normalizedIdentifier,
      password,
    );
    if (!admin) {
      this.appLogger.warn('auth.login.failed', {
        subjectType: 'PLATFORM_ADMIN',
        identifier: normalizedIdentifier,
        reason: 'invalid_credentials',
        ip: this.rateLimit.getClientIp(ctx.req),
      });
      throw new UnauthorizedException('Invalid identifier or password');
    }
    const scope = this.adminService.platformScopes(String(admin.role));
    const session = await this.authSessions.createSession({
      subjectType: 'PLATFORM_ADMIN',
      subjectId: String(admin.id),
      userAgent: String(ctx.req?.headers?.['user-agent'] ?? ''),
      ip: this.rateLimit.getClientIp(ctx.req),
    });
    const signed = this.authTokens.signAccessToken(
      {
        id: String(admin.id),
        subjectType: 'PLATFORM_ADMIN',
        role: 'platform_admin',
        platformRole: String(admin.role),
        scope,
      },
      session.sessionId,
    );
    setRefreshCookie(ctx.res, session.refreshToken);
    this.appLogger.info('auth.login.success', {
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

  @UseGuards(JwtAuthGuard)
  @Query(() => PlatformMeModel)
  async platformMe(
    @CurrentUserId() userId?: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<PlatformMeModel> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    if (!userId) throw new UnauthorizedException('Login required');
    const admin = await this.adminService.platformMe(userId);
    if (!admin) throw new UnauthorizedException('Session is no longer valid');
    return {
      id: String(admin.id),
      name: String(admin.name),
      identifier: String(admin.identifier),
      platformRole: admin.role as PlatformAdminRoleModel,
      scope: scope ?? [],
    };
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => PlatformDashboardModel)
  platformDashboard(
    @Args('range', { type: () => ReportRangeInput, nullable: true })
    range?: ReportRangeInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<PlatformDashboardModel> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    return this.adminService.platformDashboard(range);
  }

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

  private assertPlatformAdmin(
    role: string | undefined,
    scope: string[] | undefined,
    requiredScope: string,
  ): void {
    const r = role?.toLowerCase();
    if (r !== 'admin' && r !== 'platform_admin') {
      throw new ForbiddenException('Platform admin role required');
    }
    if (r !== 'admin' && !(scope ?? []).includes(requiredScope)) {
      throw new ForbiddenException(`Missing ${requiredScope} scope`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => AdminDashboardModel)
  adminDashboard(
    @Args('shopId', { type: () => String, nullable: true }) shopId?: string,
    @Args('range', { type: () => ReportRangeInput, nullable: true })
    range?: ReportRangeInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<AdminDashboardModel> {
    const r = role?.toLowerCase();
    if (r !== 'admin' && r !== 'platform_admin') {
      throw new ForbiddenException('Admin role required');
    }
    if (!(scope ?? []).includes('platform:read') && r !== 'admin') {
      throw new ForbiddenException('Missing platform:read scope');
    }
    return this.adminService.dashboard(shopId, range);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [StaffModel])
  staffs(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('status', { type: () => StaffStatusModel, nullable: true })
    status: StaffStatusModel | undefined,
    @Args('role', { type: () => String, nullable: true })
    roleFilter: string | undefined,
    @Args('phoneKeyword', { type: () => String, nullable: true })
    phoneKeyword: string | undefined,
    @Args('page', { type: () => Int, nullable: true }) page: number | undefined,
    @Args('pageSize', { type: () => Int, nullable: true })
    pageSize: number | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffModel[]> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.staffs(effectiveShopId, {
      status,
      role: roleFilter,
      phoneKeyword,
      page,
      pageSize,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => StaffModel)
  createStaff(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('input') input: CreateStaffInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffModel> {
    this.assertManagerAccess(role, scope, 'staff:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.createStaff(effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => StaffModel, { nullable: true })
  updateStaff(
    @Args('staffId') staffId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('input') input: UpdateStaffInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<StaffModel | null> {
    this.assertManagerAccess(role, scope, 'staff:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.updateStaff(staffId, effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  deleteStaff(
    @Args('staffId') staffId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('verification') verification: SensitiveActionVerificationInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserId() userId?: string,
  ): Promise<boolean> {
    this.assertManagerAccess(role, scope, 'staff:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.deleteStaff(
      staffId,
      effectiveShopId,
      userId,
      verification,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ResetPasswordPayload)
  resetStaffPassword(
    @Args('staffId') staffId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('verification') verification: SensitiveActionVerificationInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserId() userId?: string,
  ): Promise<ResetPasswordPayload> {
    this.assertManagerAccess(role, scope, 'staff:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.resetStaffPassword(
      staffId,
      effectiveShopId,
      userId,
      verification,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [PrinterModel])
  printers(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<PrinterModel[]> {
    this.assertManagerAccess(role, scope, 'printer:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.printers(effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => PrinterModel)
  createPrinter(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('input') input: CreatePrinterInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<PrinterModel> {
    this.assertManagerAccess(role, scope, 'printer:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.createPrinter(effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => PrinterModel, { nullable: true })
  updatePrinter(
    @Args('printerId') printerId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('input') input: UpdatePrinterInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<PrinterModel | null> {
    this.assertManagerAccess(role, scope, 'printer:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.updatePrinter(printerId, effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  deletePrinter(
    @Args('printerId') printerId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<boolean> {
    this.assertManagerAccess(role, scope, 'printer:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.deletePrinter(printerId, effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  testPrinter(
    @Args('printerId') printerId: string,
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<boolean> {
    this.assertManagerAccess(role, scope, 'printer:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.testPrinter(printerId, effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [PrintJobModel])
  printJobs(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<PrintJobModel[]> {
    this.assertManagerAccess(role, scope, 'printer:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.printJobs(effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ProductModel])
  products(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('category', { type: () => String, nullable: true })
    category: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<ProductModel[]> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.products(effectiveShopId, category);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => ShopModel)
  shop(
    @Args('id') id: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<ShopModel> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(id, currentShopId);
    return this.adminService.shopById(effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ShopModel)
  updateShop(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('input') input: UpdateShopInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<ShopModel> {
    this.assertManagerAccess(role, scope, 'staff:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.updateShop(effectiveShopId, input);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ShopApplicationModel])
  shopApplications(
    @Args('status', { type: () => ApplicationStatusModel, nullable: true })
    status: ApplicationStatusModel | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ShopApplicationModel[]> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    return this.adminService.shopApplications(status);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ShopApplicationModel])
  pendingShops(
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ShopApplicationModel[]> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    return this.adminService.pendingShops();
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ApproveShopApplicationPayload)
  approveShopApplication(
    @Args('shopId') shopId: string,
    @Args('input', { type: () => ApproveShopApplicationInput, nullable: true })
    input: ApproveShopApplicationInput | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<ApproveShopApplicationPayload> {
    this.assertPlatformAdmin(role, scope, 'platform:write');
    return this.adminService.approveShopApplication(shopId, input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  rejectShopApplication(
    @Args('shopId') shopId: string,
    @Args('reason') reason: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<boolean> {
    this.assertPlatformAdmin(role, scope, 'platform:write');
    return this.adminService.rejectShopApplication(shopId, reason, userId);
  }

  @Mutation(() => ShopApplicationModel)
  submitShopApplication(
    @Args('input') input: CreateShopApplicationInput,
    @Context()
    ctx: {
      req?: {
        headers?: Record<string, string | string[] | undefined>;
        ip?: string;
      };
    },
  ): Promise<ShopApplicationModel> {
    this.rateLimit.consume({
      key: `${this.rateLimit.getClientIp(ctx.req)}:${input.contactPhone}`,
      label: 'submit_shop_application',
      limit: 5,
      windowMs: 60 * 60_000,
    });
    return this.adminService.submitShopApplication(input);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ManagedShopModel])
  managedShops(
    @Args('filter', { type: () => ManagedShopsFilterInput, nullable: true })
    filter: ManagedShopsFilterInput | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ManagedShopModel[]> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    return this.adminService.managedShops(filter);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => ManagedShopDetailModel)
  managedShop(
    @Args('shopId') shopId: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<ManagedShopDetailModel> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    return this.adminService.managedShop(shopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  updateManagedShop(
    @Args('shopId') shopId: string,
    @Args('input') input: UpdateManagedShopInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<boolean> {
    this.assertPlatformAdmin(role, scope, 'platform:write');
    return this.adminService.updateManagedShop(shopId, input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ShopPaymentConfigModel)
  updateShopPaymentConfig(
    @Args('shopId') shopId: string,
    @Args('input') input: UpdateShopPaymentConfigInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<ShopPaymentConfigModel> {
    this.assertPlatformAdmin(role, scope, 'payment:write');
    return this.adminService.updateShopPaymentConfig(shopId, input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [PlatformCouponModel])
  platformCoupons(
    @Args('status', { type: () => PlatformCouponStatusModel, nullable: true })
    status: PlatformCouponStatusModel | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<PlatformCouponModel[]> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    return this.adminService.platformCoupons(status);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => PlatformCouponModel)
  createPlatformCoupon(
    @Args('input') input: CreatePlatformCouponInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<PlatformCouponModel> {
    this.assertPlatformAdmin(role, scope, 'platform:write');
    return this.adminService.createPlatformCoupon(input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [BannerModel])
  banners(
    @Args('status', { type: () => BannerStatusModel, nullable: true })
    status: BannerStatusModel | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<BannerModel[]> {
    this.assertPlatformAdmin(role, scope, 'platform:read');
    return this.adminService.banners(status);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => BannerModel)
  createBanner(
    @Args('input') input: CreateBannerInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<BannerModel> {
    this.assertPlatformAdmin(role, scope, 'platform:write');
    return this.adminService.createBanner(input, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  disableBanner(
    @Args('bannerId') bannerId: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<boolean> {
    this.assertPlatformAdmin(role, scope, 'platform:write');
    return this.adminService.disableBanner(bannerId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => PrintRetryCycleResultModel)
  runPrintRetryCycle(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserId() userId?: string,
  ): Promise<PrintRetryCycleResultModel> {
    this.assertPlatformAdmin(role, scope, 'platform:write');
    return this.adminService.runPrintRetryCycle(shopId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [PlatformAuditLogModel])
  platformAuditLogs(
    @Args('filter', { type: () => PlatformAuditLogFilterInput, nullable: true })
    filter: PlatformAuditLogFilterInput | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
  ): Promise<PlatformAuditLogModel[]> {
    this.assertPlatformAdmin(role, scope, 'platform:audit');
    return this.adminService.platformAuditLogs(filter);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => PerformanceRuleModel)
  performanceRule(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<PerformanceRuleModel> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.performanceRule(effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => PerformanceRuleModel)
  updatePerformanceRule(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('input') input: UpdatePerformanceRuleInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
    @CurrentUserId() userId?: string,
  ): Promise<PerformanceRuleModel> {
    this.assertManagerAccess(role, scope, 'staff:write');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.updatePerformanceRule(
      effectiveShopId,
      input,
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => BusinessReportModel)
  businessReport(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('range', { type: () => ReportRangeInput }) range: ReportRangeInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<BusinessReportModel> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.businessReport(effectiveShopId, range);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [PromotionStatsByStaffModel])
  promotionStatsByStaff(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('range', { type: () => ReportRangeInput }) range: ReportRangeInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<PromotionStatsByStaffModel[]> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.promotionStatsByStaff(effectiveShopId, range);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => DashboardMetricsModel)
  getDashboardMetrics(
    @Args('shopId', { type: () => String }) shopId: string,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<DashboardMetricsModel> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.getDashboardMetrics(effectiveShopId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => ExportPayloadModel)
  exportPromotionStatsCsv(
    @Args('shopId', { type: () => String, nullable: true })
    shopId: string | undefined,
    @Args('range', { type: () => ReportRangeInput }) range: ReportRangeInput,
    @CurrentUserRole() role?: string,
    @CurrentUserScope() scope?: string[],
    @CurrentUserShopId() currentShopId?: string,
  ): Promise<ExportPayloadModel> {
    this.assertManagerAccess(role, scope, 'staff:read');
    const effectiveShopId = this.resolveShopOrThrow(shopId, currentShopId);
    return this.adminService.exportPromotionStatsCsv(effectiveShopId, range);
  }
}
