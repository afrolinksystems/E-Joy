import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderState, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { getAuthConfig } from '../auth/auth-config';
import { PRISMA_CLIENT } from '../prisma/prisma.token';
import {
  AdminDashboardModel,
  ApproveShopApplicationPayload,
  BannerModel,
  BannerStatusModel,
  BusinessReportModel,
  DashboardMetricsModel,
  ExportPayloadModel,
  ApplicationStatusModel,
  PrintJobModel,
  PrintRetryCycleResultModel,
  PrintStatusModel,
  PlatformCouponModel,
  PlatformCouponRuleTypeModel,
  PlatformCouponStatusModel,
  PerformanceRuleModel,
  PromotionStatsByStaffModel,
  ManagedShopModel,
  ManagedShopStatusModel,
  ManagedShopDetailModel,
  PrinterModel,
  PrinterTypeModel,
  PaperSizeModel,
  PlatformAdminRoleModel,
  PlatformAdminStatusModel,
  PlatformAuditLogModel,
  PlatformDashboardModel,
  StaffModel,
  StaffRoleModel,
  StaffStatusModel,
  ShopApplicationModel,
  ShopPaymentConfigModel,
  ProductModel,
  TopDishModel,
} from './admin.types';
import { CustomerThemeOverridesModel, ShopModel } from '../shop/shop.types';
import {
  BannerStatusInput,
  ApproveShopApplicationInput,
  CustomerThemeOverridesInput,
  CreateBannerInput,
  CreateShopApplicationInput,
  CreatePlatformCouponInput,
  PlatformCouponRuleTypeInput,
  CreatePrinterInput,
  CreateStaffInput,
  ManagedShopsFilterInput,
  PlatformAuditLogFilterInput,
  ReportPeriodInput,
  ReportRangeInput,
  UpdateShopPaymentConfigInput,
  UpdatePerformanceRuleInput,
  UpdatePrinterInput,
  UpdateStaffInput,
  UpdateShopInput,
} from './admin.inputs';
import { ProductService } from '../product/product.service';
import {
  PAYMENT_EVENT_PRODUCER,
  type PaymentEventProducer,
} from '../payment/payment-event-producer.interface';
import { RealtimeService } from '../realtime/realtime.service';
import { SensitiveActionVerificationInput } from '../auth/sensitive-action-verification.input';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: {
      order: {
        count: (args?: unknown) => Promise<number>;
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        aggregate: (args: unknown) => Promise<{
          _sum: { totalAmount: number | null };
        }>;
      };
      orderItem: {
        groupBy: (args: unknown) => Promise<
          Array<{
            productNameSnapshot: string;
            _count: { _all: number };
          }>
        >;
      };
      $queryRaw: <T>(arg: Prisma.Sql) => Promise<T>;
      serviceTicket: {
        count: (args?: unknown) => Promise<number>;
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
      };
      staff: {
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        findFirst: (args?: unknown) => Promise<Record<string, unknown> | null>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
      platformAdmin: {
        findFirst: (args?: unknown) => Promise<Record<string, unknown> | null>;
        upsert: (args: unknown) => Promise<Record<string, unknown>>;
      };
      platformAuditLog: {
        create: (args: unknown) => Promise<Record<string, unknown>>;
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
      };
      printerConfig: {
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
        deleteMany: (args: unknown) => Promise<{ count: number }>;
      };
      printJob: {
        create: (args: unknown) => Promise<Record<string, unknown>>;
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
      shopApplication: {
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
      platformCoupon: {
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
      };
      performanceRule: {
        findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
        upsert: (args: unknown) => Promise<Record<string, unknown>>;
      };
      shop: {
        count: (args?: unknown) => Promise<number>;
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
        findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
        findUniqueOrThrow: (args: unknown) => Promise<Record<string, unknown>>;
        update: (args: unknown) => Promise<Record<string, unknown>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
      shopPaymentConfig: {
        findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
        upsert: (args: unknown) => Promise<Record<string, unknown>>;
      };
      product: {
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
      marketingBanner: {
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
    },
    @Inject(PAYMENT_EVENT_PRODUCER)
    private readonly eventProducer: PaymentEventProducer,
    private readonly realtimeService: RealtimeService,
    private readonly productService: ProductService,
    private readonly authSessions: AuthSessionService,
  ) {}

  platformScopes(role: string): string[] {
    const base = [
      'platform:read',
      'platform:write',
      'platform:audit',
      'payment:write',
    ];
    return role.toUpperCase() === PlatformAdminRoleModel.OWNER ? base : base;
  }

  async authenticatePlatformAdmin(
    identifier: string,
    password: string,
  ): Promise<Record<string, unknown> | null> {
    const admin = await this.prisma.platformAdmin.findFirst({
      where: {
        identifier: identifier.trim().toLowerCase(),
        status: PlatformAdminStatusModel.ACTIVE,
      },
    });
    const hash =
      typeof admin?.passwordHash === 'string' ? admin.passwordHash : '';
    if (!admin || !(await bcrypt.compare(password, hash))) {
      await this.recordAudit({
        actorId: undefined,
        action: 'PLATFORM_LOGIN_FAILED',
        targetType: 'PlatformAdmin',
        targetId: identifier.trim().toLowerCase(),
      });
      return null;
    }
    await this.recordAudit({
      actorId: String(admin.id),
      action: 'PLATFORM_LOGIN_SUCCESS',
      targetType: 'PlatformAdmin',
      targetId: String(admin.id),
    });
    return admin;
  }

  async platformMe(adminId: string): Promise<Record<string, unknown> | null> {
    return this.prisma.platformAdmin.findFirst({
      where: { id: adminId, status: PlatformAdminStatusModel.ACTIVE },
    });
  }

  async changePlatformPassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    this.assertStrongPassword(newPassword);
    const admin = await this.prisma.platformAdmin.findFirst({
      where: { id: adminId, status: PlatformAdminStatusModel.ACTIVE },
    });
    const hash =
      typeof admin?.passwordHash === 'string' ? admin.passwordHash : '';
    if (!admin || !(await bcrypt.compare(currentPassword, hash))) {
      return false;
    }
    await this.prisma.platformAdmin.upsert({
      where: { identifier: String(admin.identifier) },
      update: {
        passwordHash: await this.hashPassword(newPassword),
      },
      create: {
        name: String(admin.name),
        identifier: String(admin.identifier),
        passwordHash: await this.hashPassword(newPassword),
        role: admin.role as PlatformAdminRoleModel,
        status: PlatformAdminStatusModel.ACTIVE,
      },
    });
    await this.authSessions.revokeSubject(
      'PLATFORM_ADMIN',
      adminId,
      'password_changed',
    );
    return true;
  }

  async platformDashboard(
    range?: ReportRangeInput,
  ): Promise<PlatformDashboardModel> {
    const rangeStart = this.resolveRangeStart(
      range?.period ?? ReportPeriodInput.DAY,
    );
    const [totalShops, activeShops, pendingApplications, orders] =
      await Promise.all([
        this.prisma.shop.count(),
        this.prisma.shop.count({ where: { active: true } }),
        this.prisma.shopApplication.findMany({
          where: { status: ApplicationStatusModel.PENDING },
          take: 1000,
        }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: rangeStart } },
          select: {
            paymentState: true,
            state: true,
            totalAmount: true,
          },
        }),
      ]);
    return {
      totalShops,
      activeShops,
      pendingApplications: pendingApplications.length,
      totalOrders: orders.length,
      paidOrders: orders.filter((o) => String(o.paymentState) === 'SUCCESS')
        .length,
      failedPayments: orders.filter(
        (o) =>
          String(o.paymentState) === 'FAILED' ||
          String(o.state) === 'PAYMENT_FAILED',
      ).length,
      totalRevenueCent: orders
        .filter((o) => String(o.paymentState) === 'SUCCESS')
        .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0),
    };
  }

  async dashboard(
    shopId?: string,
    range?: ReportRangeInput,
  ): Promise<AdminDashboardModel> {
    const whereBase = shopId ? { shopId } : {};
    const rangeStart = this.resolveRangeStart(
      range?.period ?? ReportPeriodInput.DAY,
    );
    const whereRange = { ...whereBase, createdAt: { gte: rangeStart } };
    const orders = await this.prisma.order.findMany({
      where: whereRange,
      select: {
        shopId: true,
        userId: true,
        paymentState: true,
        state: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const totalOrders = orders.length;
    const paidOrders = orders.filter(
      (o) => o.paymentState === 'SUCCESS',
    ).length;
    const paymentFailedOrders = orders.filter(
      (o) => o.state === 'PAYMENT_FAILED',
    ).length;
    const totalRevenueCent = orders
      .filter((o) => o.paymentState === 'SUCCESS')
      .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);
    const activeRestaurants = new Set(orders.map((o) => String(o.shopId))).size;
    const totalUsers = new Set(orders.map((o) => String(o.userId))).size;
    const openServiceTickets = await this.prisma.serviceTicket.count({
      where: {
        ...whereBase,
        status: 'OPEN',
        createdAt: { gte: rangeStart },
      },
    });
    const orderTrend = this.buildOrderTrend(orders, rangeStart);
    return {
      totalOrders,
      paidOrders,
      paymentFailedOrders,
      openServiceTickets,
      totalRevenueCent,
      activeRestaurants,
      totalUsers,
      orderTrend,
    };
  }

  private resolveRangeStart(period: ReportPeriodInput): Date {
    const now = new Date();
    if (period === ReportPeriodInput.MONTH) {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (period === ReportPeriodInput.WEEK) {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  private buildOrderTrend(
    orders: Array<Record<string, unknown>>,
    rangeStart: Date,
  ): number[] {
    const bucketCount = 4;
    const now = Date.now();
    const totalMs = Math.max(now - rangeStart.getTime(), 1);
    const bucketMs = totalMs / bucketCount;
    const trend = [0, 0, 0, 0];
    for (const order of orders) {
      const createdAt = new Date(String(order.createdAt)).getTime();
      const offset = Math.max(0, createdAt - rangeStart.getTime());
      const idx = Math.min(bucketCount - 1, Math.floor(offset / bucketMs));
      trend[idx] += 1;
    }
    return trend;
  }

  async staffs(
    shopId: string,
    filters?: {
      status?: StaffStatusModel;
      role?: string;
      phoneKeyword?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<StaffModel[]> {
    const page = Math.max(filters?.page ?? 1, 1);
    const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 100);
    const rows = await this.prisma.staff.findMany({
      where: {
        shopId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.role ? { role: filters.role } : {}),
        ...(filters?.phoneKeyword
          ? { phone: { contains: filters.phoneKeyword } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return rows.map((row) => this.toStaffModel(row));
  }

  async createStaff(
    shopId: string,
    input: CreateStaffInput,
  ): Promise<StaffModel> {
    const passwordHash = await this.hashPassword('Temp@123456');
    const created = await this.prisma.staff.create({
      data: {
        shopId,
        name: input.name,
        phone: input.phone,
        role: input.role,
        status: StaffStatusModel.ACTIVE,
        passwordHash,
      },
    });
    return this.toStaffModel(created);
  }

  async updateStaff(
    staffId: string,
    shopId: string,
    input: UpdateStaffInput,
  ): Promise<StaffModel | null> {
    const updated = await this.prisma.staff.updateMany({
      where: { id: staffId, shopId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    if (updated.count === 0) {
      return null;
    }
    const rows = await this.prisma.staff.findMany({
      where: { id: staffId, shopId },
      take: 1,
    });
    return rows[0] ? this.toStaffModel(rows[0]) : null;
  }

  async deleteStaff(
    staffId: string,
    shopId: string,
    actorUserId: string | undefined,
    verification: SensitiveActionVerificationInput,
  ): Promise<boolean> {
    this.assertSensitiveAction(verification);
    const updated = await this.prisma.staff.updateMany({
      where: { id: staffId, shopId },
      data: { status: StaffStatusModel.INACTIVE },
    });
    this.auditSensitiveAction('DELETE_STAFF', {
      actorUserId,
      shopId,
      targetId: staffId,
      success: updated.count > 0,
      reason: verification.reason,
    });
    return updated.count > 0;
  }

  async resetStaffPassword(
    staffId: string,
    shopId: string,
    actorUserId: string | undefined,
    verification: SensitiveActionVerificationInput,
  ): Promise<{ ok: boolean; temporaryPassword: string }> {
    this.assertSensitiveAction(verification);
    const temporaryPassword = `Tmp${randomBytes(4).toString('hex')}`;
    const passwordHash = await this.hashPassword(temporaryPassword);
    const updated = await this.prisma.staff.updateMany({
      where: { id: staffId, shopId },
      data: {
        passwordHash,
      },
    });
    const ok = updated.count > 0;
    this.auditSensitiveAction('RESET_STAFF_PASSWORD', {
      actorUserId,
      shopId,
      targetId: staffId,
      success: ok,
      reason: verification.reason,
    });
    if (ok) {
      await this.authSessions.revokeSubject(
        'STAFF',
        staffId,
        'staff_password_reset',
      );
    }
    return {
      ok,
      temporaryPassword,
    };
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
    meta: {
      actorUserId?: string;
      shopId?: string;
      targetId?: string;
      success: boolean;
      reason?: string;
    },
  ): void {
    this.logger.warn(
      JSON.stringify({
        event: 'sensitive_operation_audit',
        action,
        actorUserId: meta.actorUserId ?? 'unknown',
        shopId: meta.shopId ?? 'unknown',
        targetId: meta.targetId ?? 'unknown',
        success: meta.success,
        reason: meta.reason ?? null,
        at: new Date().toISOString(),
      }),
    );
  }

  private async recordAudit(input: {
    actorId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    requestId?: string;
    sourceIp?: string;
  }): Promise<void> {
    try {
      await this.prisma.platformAuditLog.create({
        data: {
          actorId: input.actorId ?? null,
          action: input.action,
          targetType: input.targetType ?? null,
          targetId: input.targetId ?? null,
          metadata: input.metadata ?? undefined,
          requestId: input.requestId ?? null,
          sourceIp: input.sourceIp ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(
        `platform audit write failed for ${input.action}: ${
          err instanceof Error ? err.message : 'unknown error'
        }`,
      );
    }
  }

  private async hashPassword(rawPassword: string): Promise<string> {
    return bcrypt.hash(rawPassword, getAuthConfig().bcryptCost);
  }

  private assertStrongPassword(password: string): void {
    const strong =
      password.length >= 10 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password);
    if (!strong) {
      throw new BadRequestException(
        'Password must be at least 10 characters and include upper, lower, and numeric characters',
      );
    }
  }

  private toStaffModel(row: Record<string, unknown>): StaffModel {
    return {
      id: String(row.id),
      shopId: String(row.shopId),
      name: String(row.name),
      phone: String(row.phone),
      role: row.role as StaffRoleModel,
      status: row.status as StaffStatusModel,
    };
  }

  async printers(shopId: string): Promise<PrinterModel[]> {
    const rows = await this.prisma.printerConfig.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toPrinterModel(row));
  }

  async createPrinter(
    shopId: string,
    input: CreatePrinterInput,
  ): Promise<PrinterModel> {
    const created = await this.prisma.printerConfig.create({
      data: {
        shopId,
        name: input.name,
        printerType: input.printerType,
        ipAddress: input.ipAddress,
        port: input.port,
        paperSize: input.paperSize,
        categoryFilter: input.categoryFilter ?? [],
        enabled: input.enabled,
      },
    });
    return this.toPrinterModel(created);
  }

  async updatePrinter(
    printerId: string,
    shopId: string,
    input: UpdatePrinterInput,
  ): Promise<PrinterModel | null> {
    const updated = await this.prisma.printerConfig.updateMany({
      where: { id: printerId, shopId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.printerType !== undefined
          ? { printerType: input.printerType }
          : {}),
        ...(input.ipAddress !== undefined
          ? { ipAddress: input.ipAddress }
          : {}),
        ...(input.port !== undefined ? { port: input.port } : {}),
        ...(input.paperSize !== undefined
          ? { paperSize: input.paperSize }
          : {}),
        ...(input.categoryFilter !== undefined
          ? { categoryFilter: input.categoryFilter }
          : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      },
    });
    if (updated.count === 0) return null;
    const rows = await this.prisma.printerConfig.findMany({
      where: { id: printerId, shopId },
      take: 1,
    });
    return rows[0] ? this.toPrinterModel(rows[0]) : null;
  }

  async deletePrinter(printerId: string, shopId: string): Promise<boolean> {
    const deleted = await this.prisma.printerConfig.deleteMany({
      where: { id: printerId, shopId },
    });
    return deleted.count > 0;
  }

  async testPrinter(printerId: string, shopId: string): Promise<boolean> {
    const rows = await this.prisma.printerConfig.findMany({
      where: { id: printerId, shopId, enabled: true },
      take: 1,
    });
    if (!rows[0]) {
      return false;
    }
    return true;
  }

  async printJobs(shopId: string): Promise<PrintJobModel[]> {
    const rows = await this.prisma.printJob.findMany({
      where: { printer: { shopId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((row) => ({
      id: String(row.id),
      orderId: String(row.orderId),
      printerId: String(row.printerId),
      status: row.status as PrintStatusModel,
      retryCount: Number(row.retryCount),
      errorMessage:
        typeof row.errorMessage === 'string' ? row.errorMessage : undefined,
    }));
  }

  private toPrinterModel(row: Record<string, unknown>): PrinterModel {
    return {
      id: String(row.id),
      shopId: String(row.shopId),
      name: String(row.name),
      printerType: row.printerType as PrinterTypeModel,
      ipAddress: typeof row.ipAddress === 'string' ? row.ipAddress : undefined,
      paperSize: row.paperSize as PaperSizeModel,
      categoryFilter: Array.isArray(row.categoryFilter)
        ? row.categoryFilter.map((v) => String(v))
        : [],
      enabled: Boolean(row.enabled),
    };
  }

  async pendingShops(): Promise<ShopApplicationModel[]> {
    return this.shopApplications(ApplicationStatusModel.PENDING);
  }

  async shopApplications(
    status?: ApplicationStatusModel,
  ): Promise<ShopApplicationModel[]> {
    const rows = await this.prisma.shopApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => ({
      id: String(row.id),
      shopName: String(row.shopName),
      contactName: String(row.contactName),
      contactPhone: String(row.contactPhone),
      status: row.status as ApplicationStatusModel,
      rejectReason:
        typeof row.rejectReason === 'string' ? row.rejectReason : undefined,
      createdShopId:
        typeof row.createdShopId === 'string' ? row.createdShopId : undefined,
    }));
  }

  async submitShopApplication(
    input: CreateShopApplicationInput,
  ): Promise<ShopApplicationModel> {
    const created = await this.prisma.shopApplication.create({
      data: {
        shopName: input.shopName,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        businessLicense: input.businessLicense,
        status: ApplicationStatusModel.PENDING,
      },
    });
    return {
      id: String(created.id),
      shopName: String(created.shopName),
      contactName: String(created.contactName),
      contactPhone: String(created.contactPhone),
      status: created.status as ApplicationStatusModel,
      rejectReason:
        typeof created.rejectReason === 'string'
          ? created.rejectReason
          : undefined,
      createdShopId:
        typeof created.createdShopId === 'string'
          ? created.createdShopId
          : undefined,
    };
  }

  async approveShopApplication(
    applicationId: string,
    input: ApproveShopApplicationInput | undefined,
    operatorUserId?: string,
  ): Promise<ApproveShopApplicationPayload> {
    const application = await this.prisma.shopApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      throw new NotFoundException(
        `Shop application not found: ${applicationId}`,
      );
    }
    if (application.status !== ApplicationStatusModel.PENDING) {
      return {
        ok: false,
        shopId:
          typeof application.createdShopId === 'string'
            ? application.createdShopId
            : undefined,
      };
    }

    const shop = await this.prisma.shop.create({
      data: {
        name: input?.shopName?.trim() || String(application.shopName),
        contactPhone:
          input?.managerPhone?.trim() || String(application.contactPhone),
        updatedBy: operatorUserId ?? undefined,
      },
    });
    const temporaryPassword = `Mgr${randomBytes(5).toString('hex')}`;
    const manager = await this.prisma.staff.create({
      data: {
        shopId: String(shop.id),
        name: input?.managerName?.trim() || String(application.contactName),
        phone: input?.managerPhone?.trim() || String(application.contactPhone),
        role: StaffRoleModel.MANAGER,
        status: StaffStatusModel.ACTIVE,
        passwordHash: await this.hashPassword(temporaryPassword),
      },
    });
    await this.prisma.shopApplication.updateMany({
      where: { id: applicationId, status: ApplicationStatusModel.PENDING },
      data: {
        status: ApplicationStatusModel.APPROVED,
        rejectReason: null,
        createdShopId: String(shop.id),
      },
    });
    await this.recordAudit({
      actorId: operatorUserId,
      action: 'SHOP_APPLICATION_APPROVED',
      targetType: 'ShopApplication',
      targetId: applicationId,
      metadata: { shopId: String(shop.id), managerStaffId: String(manager.id) },
    });
    return {
      ok: true,
      shopId: String(shop.id),
      managerStaffId: String(manager.id),
      temporaryPassword,
    };
  }

  async rejectShopApplication(
    shopId: string,
    reason: string,
    operatorUserId?: string,
  ): Promise<boolean> {
    const updated = await this.prisma.shopApplication.updateMany({
      where: { id: shopId, status: ApplicationStatusModel.PENDING },
      data: {
        status: ApplicationStatusModel.REJECTED,
        rejectReason: reason,
      },
    });
    if (updated.count > 0) {
      await this.recordAudit({
        actorId: operatorUserId,
        action: 'SHOP_APPLICATION_REJECTED',
        targetType: 'ShopApplication',
        targetId: shopId,
        metadata: { reason },
      });
    }
    return updated.count > 0;
  }

  async managedShops(
    filter?: ManagedShopsFilterInput,
  ): Promise<ManagedShopModel[]> {
    const search = filter?.search?.trim();
    const rows = await this.prisma.shop.findMany({
      where: {
        ...(typeof filter?.online === 'boolean'
          ? { active: filter.online }
          : {}),
        ...(search
          ? {
              OR: [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return Promise.all(rows.map((row) => this.toManagedShopModel(row)));
  }

  async updateManagedShop(
    shopId: string,
    input: { name?: string; online?: boolean },
    operatorUserId?: string,
  ): Promise<boolean> {
    const updated = await this.prisma.shop.updateMany({
      where: { id: shopId },
      data: {
        ...(typeof input.name === 'string' ? { name: input.name } : {}),
        ...(typeof input.online === 'boolean' ? { active: input.online } : {}),
        updatedBy: operatorUserId ?? 'unknown_operator',
      },
    });
    if (updated.count > 0) {
      await this.recordAudit({
        actorId: operatorUserId,
        action: 'MANAGED_SHOP_UPDATED',
        targetType: 'Shop',
        targetId: shopId,
        metadata: input,
      });
      this.logger.log(
        JSON.stringify({
          event: 'MANAGED_SHOP_UPDATED',
          shopId,
          operatorUserId: operatorUserId ?? 'unknown_operator',
          payload: input,
        }),
      );
    }
    return updated.count > 0;
  }

  async managedShop(shopId: string): Promise<ManagedShopDetailModel> {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException(`Shop not found: ${shopId}`);
    const [managers, paymentConfig] = await Promise.all([
      this.prisma.staff.findMany({
        where: { shopId, role: StaffRoleModel.MANAGER },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.shopPaymentConfig.findUnique({ where: { shopId } }),
    ]);
    return {
      shop: await this.toManagedShopModel(shop),
      managers: managers.map((row) => this.toStaffModel(row)),
      paymentConfig: paymentConfig
        ? this.toPaymentConfigModel(paymentConfig)
        : undefined,
    };
  }

  async updateShopPaymentConfig(
    shopId: string,
    input: UpdateShopPaymentConfigInput,
    operatorUserId?: string,
  ): Promise<ShopPaymentConfigModel> {
    const row = await this.prisma.shopPaymentConfig.upsert({
      where: { shopId },
      create: {
        shopId,
        provider: input.provider?.trim() || 'TELEBIRR',
        merchantId: input.merchantId?.trim() || null,
        appId: input.appId?.trim() || null,
        enabled: input.enabled ?? false,
        testMode: input.testMode ?? true,
        updatedBy: operatorUserId ?? undefined,
      },
      update: {
        ...(input.provider !== undefined
          ? { provider: input.provider.trim() || 'TELEBIRR' }
          : {}),
        ...(input.merchantId !== undefined
          ? { merchantId: input.merchantId.trim() || null }
          : {}),
        ...(input.appId !== undefined
          ? { appId: input.appId.trim() || null }
          : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.testMode !== undefined ? { testMode: input.testMode } : {}),
        updatedBy: operatorUserId ?? undefined,
      },
    });
    await this.recordAudit({
      actorId: operatorUserId,
      action: 'SHOP_PAYMENT_CONFIG_UPDATED',
      targetType: 'Shop',
      targetId: shopId,
      metadata: {
        provider: input.provider,
        enabled: input.enabled,
        testMode: input.testMode,
      },
    });
    return this.toPaymentConfigModel(row);
  }

  async platformAuditLogs(
    filter?: PlatformAuditLogFilterInput,
  ): Promise<PlatformAuditLogModel[]> {
    const rows = await this.prisma.platformAuditLog.findMany({
      where: {
        ...(filter?.action ? { action: filter.action } : {}),
        ...(filter?.actorId ? { actorId: filter.actorId } : {}),
        ...(filter?.targetType ? { targetType: filter.targetType } : {}),
        ...(filter?.targetId ? { targetId: filter.targetId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(filter?.limit ?? 100, 1), 250),
    });
    return rows.map((row) => this.toAuditLogModel(row));
  }

  private async toManagedShopModel(
    row: Record<string, unknown>,
  ): Promise<ManagedShopModel> {
    const shopId = String(row.id);
    const revenue = await this.prisma.order.aggregate({
      where: {
        shopId,
        paymentState: 'SUCCESS',
      },
      _sum: { totalAmount: true },
    });
    const orderCount = await this.prisma.order.count({ where: { shopId } });
    return {
      id: shopId,
      name: String(row.name),
      status:
        row.active === true
          ? ManagedShopStatusModel.ONLINE
          : ManagedShopStatusModel.OFFLINE,
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : new Date().toISOString(),
      updatedBy: typeof row.updatedBy === 'string' ? row.updatedBy : undefined,
      orderCount,
      revenueCent: Number(revenue._sum.totalAmount ?? 0),
    };
  }

  private toPaymentConfigModel(
    row: Record<string, unknown>,
  ): ShopPaymentConfigModel {
    return {
      id: String(row.id),
      shopId: String(row.shopId),
      provider: typeof row.provider === 'string' ? row.provider : 'TELEBIRR',
      merchantId:
        typeof row.merchantId === 'string' ? row.merchantId : undefined,
      appId: typeof row.appId === 'string' ? row.appId : undefined,
      enabled: Boolean(row.enabled),
      testMode: Boolean(row.testMode),
      updatedBy: typeof row.updatedBy === 'string' ? row.updatedBy : undefined,
    };
  }

  private toAuditLogModel(row: Record<string, unknown>): PlatformAuditLogModel {
    return {
      id: String(row.id),
      actorId: typeof row.actorId === 'string' ? row.actorId : undefined,
      action: String(row.action),
      targetType:
        typeof row.targetType === 'string' ? row.targetType : undefined,
      targetId: typeof row.targetId === 'string' ? row.targetId : undefined,
      metadata:
        row.metadata === undefined || row.metadata === null
          ? undefined
          : JSON.stringify(row.metadata),
      requestId: typeof row.requestId === 'string' ? row.requestId : undefined,
      sourceIp: typeof row.sourceIp === 'string' ? row.sourceIp : undefined,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : new Date().toISOString(),
    };
  }

  async platformCoupons(
    status?: PlatformCouponStatusModel,
  ): Promise<PlatformCouponModel[]> {
    const rows = await this.prisma.platformCoupon.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => ({
      id: String(row.id),
      code: String(row.code),
      discountValue: Number(row.discountValue),
      status: row.status as PlatformCouponStatusModel,
      ruleType: this.parseCouponRuleType(row.scopeType),
      minOrderAmount: this.parseMinOrderAmount(row.scopeType),
      targetShopIds: Array.isArray(row.targetShopIds)
        ? (row.targetShopIds as string[])
        : [],
      targetProductIds: Array.isArray(row.targetProductIds)
        ? (row.targetProductIds as string[])
        : [],
    }));
  }

  async createPlatformCoupon(
    input: CreatePlatformCouponInput,
    operatorUserId?: string,
  ): Promise<PlatformCouponModel> {
    const created = await this.prisma.platformCoupon.create({
      data: {
        code: input.code,
        discountValue: input.discountValue,
        status: input.status,
        validFrom: new Date(input.validFrom),
        validUntil: new Date(input.validUntil),
        usageLimit: input.usageLimit ?? 0,
        scopeType: this.composeScopeType(input.ruleType, input.minOrderAmount),
        targetShopIds: input.targetShopIds ?? [],
        targetProductIds: input.targetProductIds ?? [],
      },
    });
    await this.recordAudit({
      actorId: operatorUserId,
      action: 'PLATFORM_COUPON_CREATED',
      targetType: 'PlatformCoupon',
      targetId: String(created.id),
      metadata: { code: input.code, status: input.status },
    });
    return {
      id: String(created.id),
      code: String(created.code),
      discountValue: Number(created.discountValue),
      status: created.status as PlatformCouponStatusModel,
      ruleType: this.parseCouponRuleType(created.scopeType),
      minOrderAmount: this.parseMinOrderAmount(created.scopeType),
      targetShopIds: Array.isArray(created.targetShopIds)
        ? (created.targetShopIds as string[])
        : [],
      targetProductIds: Array.isArray(created.targetProductIds)
        ? (created.targetProductIds as string[])
        : [],
    };
  }

  async banners(status?: BannerStatusModel): Promise<BannerModel[]> {
    const rows = await this.prisma.marketingBanner.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.toBannerModel(row));
  }

  async createBanner(
    input: CreateBannerInput,
    operatorUserId?: string,
  ): Promise<BannerModel> {
    const created = await this.prisma.marketingBanner.create({
      data: {
        title: input.title,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl ?? null,
        status: input.status,
      },
    });
    await this.recordAudit({
      actorId: operatorUserId,
      action: 'MARKETING_BANNER_CREATED',
      targetType: 'MarketingBanner',
      targetId: String(created.id),
      metadata: { title: input.title, status: input.status },
    });
    return this.toBannerModel(created);
  }

  async disableBanner(
    bannerId: string,
    operatorUserId?: string,
  ): Promise<boolean> {
    const updated = await this.prisma.marketingBanner.updateMany({
      where: { id: bannerId },
      data: { status: BannerStatusInput.DISABLED },
    });
    if (updated.count > 0) {
      await this.recordAudit({
        actorId: operatorUserId,
        action: 'MARKETING_BANNER_DISABLED',
        targetType: 'MarketingBanner',
        targetId: bannerId,
      });
    }
    return updated.count > 0;
  }

  private toBannerModel(row: Record<string, unknown>): BannerModel {
    return {
      id: String(row.id),
      title: String(row.title),
      imageUrl: String(row.imageUrl),
      linkUrl: typeof row.linkUrl === 'string' ? row.linkUrl : undefined,
      status: row.status as BannerStatusModel,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : new Date().toISOString(),
    };
  }

  async products(shopId: string, category?: string): Promise<ProductModel[]> {
    return this.productService.listProducts(shopId, category);
  }

  async shopById(shopId: string): Promise<ShopModel> {
    const row = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!row) {
      throw new NotFoundException(`Shop not found: ${shopId}`);
    }
    return this.toShopModel(row);
  }

  async updateShop(shopId: string, input: UpdateShopInput): Promise<ShopModel> {
    const existing = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });
    if (!existing) {
      throw new NotFoundException(`Shop not found: ${shopId}`);
    }
    const name = input.name !== undefined ? input.name.trim() : undefined;
    const customerThemePreset =
      input.customerThemePreset !== undefined
        ? input.customerThemePreset.trim() || null
        : undefined;
    const customerThemeOverrides =
      input.customerThemeOverrides !== undefined
        ? this.normalizeCustomerThemeOverrides(input.customerThemeOverrides)
        : undefined;
    if (name !== undefined && name === '') {
      throw new BadRequestException('name cannot be empty');
    }
    await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
        ...(input.contactPhone !== undefined
          ? { contactPhone: input.contactPhone.trim() || null }
          : {}),
        ...(input.logoUrl !== undefined
          ? {
              logoUrl:
                input.logoUrl.trim() === '' ? null : input.logoUrl.trim(),
            }
          : {}),
        ...(customerThemePreset !== undefined ? { customerThemePreset } : {}),
        ...(customerThemeOverrides !== undefined
          ? {
              customerThemeOverridesJson:
                customerThemeOverrides === null
                  ? null
                  : JSON.stringify(customerThemeOverrides),
            }
          : {}),
        ...(input.isOpen !== undefined ? { active: input.isOpen } : {}),
      },
    });
    const row = await this.prisma.shop.findUniqueOrThrow({
      where: { id: shopId },
    });
    return this.toShopModel(row);
  }

  private toShopModel(row: Record<string, unknown>): ShopModel {
    return {
      id: String(row.id),
      name: String(row.name),
      description:
        typeof row.description === 'string' ? row.description : undefined,
      contactPhone:
        typeof row.contactPhone === 'string' ? row.contactPhone : undefined,
      logoUrl: typeof row.logoUrl === 'string' ? row.logoUrl : undefined,
      customerThemePreset:
        typeof row.customerThemePreset === 'string'
          ? row.customerThemePreset
          : undefined,
      customerThemeOverrides: this.parseCustomerThemeOverrides(
        row.customerThemeOverridesJson,
      ),
      active: Boolean(row.active),
    };
  }

  private normalizeCustomerThemeOverrides(
    input: CustomerThemeOverridesInput,
  ): CustomerThemeOverridesModel | null {
    const entries = Object.entries(input).flatMap(([key, value]) => {
      if (typeof value !== 'string') return [];
      const trimmed = value.trim();
      return trimmed ? [[key, trimmed] as const] : [];
    });
    if (!entries.length) {
      return null;
    }
    return Object.fromEntries(entries) as CustomerThemeOverridesModel;
  }

  private parseCustomerThemeOverrides(
    raw: unknown,
  ): CustomerThemeOverridesModel | undefined {
    if (typeof raw !== 'string' || raw.trim() === '') {
      return undefined;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const entries = Object.entries(parsed).flatMap(([key, value]) => {
        if (typeof value !== 'string') return [];
        const trimmed = value.trim();
        return trimmed ? [[key, trimmed] as const] : [];
      });
      if (!entries.length) {
        return undefined;
      }
      return Object.fromEntries(entries) as CustomerThemeOverridesModel;
    } catch {
      return undefined;
    }
  }

  private composeScopeType(
    ruleType: PlatformCouponRuleTypeInput,
    minOrderAmount?: number,
  ): string {
    if (ruleType === PlatformCouponRuleTypeInput.MIN_ORDER) {
      return `MIN_ORDER:${Math.max(0, minOrderAmount ?? 0)}`;
    }
    if (ruleType === PlatformCouponRuleTypeInput.TARGET_SCOPE) {
      return 'TARGET_SCOPE';
    }
    return 'NEW_USER';
  }

  private parseCouponRuleType(
    scopeTypeRaw: unknown,
  ): PlatformCouponRuleTypeModel {
    const scopeType =
      typeof scopeTypeRaw === 'string' ? scopeTypeRaw : 'NEW_USER';
    if (scopeType.startsWith('MIN_ORDER:')) {
      return PlatformCouponRuleTypeModel.MIN_ORDER;
    }
    if (scopeType === 'TARGET_SCOPE') {
      return PlatformCouponRuleTypeModel.TARGET_SCOPE;
    }
    return PlatformCouponRuleTypeModel.NEW_USER;
  }

  private parseMinOrderAmount(scopeTypeRaw: unknown): number | undefined {
    const scopeType =
      typeof scopeTypeRaw === 'string' ? scopeTypeRaw : 'NEW_USER';
    if (!scopeType.startsWith('MIN_ORDER:')) {
      return undefined;
    }
    const amount = Number(scopeType.replace('MIN_ORDER:', ''));
    return Number.isFinite(amount) ? amount : undefined;
  }

  async runPrintRetryCycle(
    shopId?: string,
    operatorUserId?: string,
  ): Promise<PrintRetryCycleResultModel> {
    const jobs = await this.prisma.printJob.findMany({
      where: {
        status: { in: [PrintStatusModel.PENDING, PrintStatusModel.FAILED] },
        retryCount: { lt: 3 },
        ...(shopId ? { printer: { shopId } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let alerted = 0;

    for (const job of jobs) {
      processed += 1;
      const canPrint = true;
      if (canPrint) {
        await this.prisma.printJob.updateMany({
          where: { id: job.id },
          data: {
            status: PrintStatusModel.SUCCESS,
            printedAt: new Date(),
            errorMessage: null,
          },
        });
        succeeded += 1;
        await this.realtimeService.publishPrintJobUpdated({
          id: String(job.id),
          orderId: String(job.orderId),
          printerId: String(job.printerId),
          status: PrintStatusModel.SUCCESS,
          retryCount: Number(job.retryCount),
          shopId: shopId ?? undefined,
        });
        continue;
      }

      const nextRetryCount = Number(job.retryCount) + 1;
      const isFinalFailure = nextRetryCount >= 3;
      await this.prisma.printJob.updateMany({
        where: { id: job.id },
        data: {
          status: PrintStatusModel.FAILED,
          retryCount: nextRetryCount,
          errorMessage: isFinalFailure
            ? 'FAILED_AFTER_MAX_RETRIES'
            : 'RETRY_SCHEDULED',
        },
      });
      failed += 1;
      await this.realtimeService.publishPrintJobUpdated({
        id: String(job.id),
        orderId: String(job.orderId),
        printerId: String(job.printerId),
        status: PrintStatusModel.FAILED,
        retryCount: nextRetryCount,
        shopId: shopId ?? undefined,
      });

      if (isFinalFailure) {
        await this.eventProducer.publish('print.alert', {
          printJobId: String(job.id),
          orderId: String(job.orderId),
          printerId: String(job.printerId),
          retryCount: nextRetryCount,
          reason: 'FAILED_AFTER_MAX_RETRIES',
        });
        alerted += 1;
      }
    }

    const result = {
      processed,
      succeeded,
      failed,
      alerted,
    };
    await this.recordAudit({
      actorId: operatorUserId,
      action: 'PRINT_RETRY_CYCLE_RUN',
      targetType: shopId ? 'Shop' : 'Platform',
      targetId: shopId,
      metadata: result,
    });
    return result;
  }

  async performanceRule(shopId: string): Promise<PerformanceRuleModel> {
    const row = await this.prisma.performanceRule.findUnique({
      where: { shopId },
    });
    if (!row) {
      return {
        id: 'draft',
        shopId,
        responseRateWeight: 40,
        avgResponseSecondsWeight: 30,
        resolvedCountWeight: 30,
        rewardRulesJson: undefined,
      };
    }
    return this.toPerformanceRuleModel(row);
  }

  async updatePerformanceRule(
    shopId: string,
    input: UpdatePerformanceRuleInput,
    actorUserId?: string,
  ): Promise<PerformanceRuleModel> {
    const sum =
      input.responseRateWeight +
      input.avgResponseSecondsWeight +
      input.resolvedCountWeight;
    if (sum !== 100) {
      throw new ForbiddenException('Weight sum must equal 100');
    }
    const row = await this.prisma.performanceRule.upsert({
      where: { shopId },
      update: {
        responseRateWeight: input.responseRateWeight,
        avgResponseSecondsWeight: input.avgResponseSecondsWeight,
        resolvedCountWeight: input.resolvedCountWeight,
        rewardRulesJson: input.rewardRulesJson
          ? JSON.parse(input.rewardRulesJson)
          : undefined,
        updatedBy: actorUserId ?? undefined,
      },
      create: {
        shopId,
        responseRateWeight: input.responseRateWeight,
        avgResponseSecondsWeight: input.avgResponseSecondsWeight,
        resolvedCountWeight: input.resolvedCountWeight,
        rewardRulesJson: input.rewardRulesJson
          ? JSON.parse(input.rewardRulesJson)
          : undefined,
        updatedBy: actorUserId ?? undefined,
      },
    });
    return this.toPerformanceRuleModel(row);
  }

  private toPerformanceRuleModel(
    row: Record<string, unknown>,
  ): PerformanceRuleModel {
    return {
      id: String(row.id),
      shopId: String(row.shopId),
      responseRateWeight: Number(row.responseRateWeight ?? 40),
      avgResponseSecondsWeight: Number(row.avgResponseSecondsWeight ?? 30),
      resolvedCountWeight: Number(row.resolvedCountWeight ?? 30),
      rewardRulesJson:
        row.rewardRulesJson === null || row.rewardRulesJson === undefined
          ? undefined
          : JSON.stringify(row.rewardRulesJson),
    };
  }

  async businessReport(
    shopId: string,
    range: ReportRangeInput,
  ): Promise<BusinessReportModel> {
    const timeRange = this.resolveTimeRange(range.period);
    const orders = await this.prisma.order.findMany({
      where: {
        shopId,
        createdAt: { gte: timeRange.start, lte: timeRange.end },
      },
      select: { id: true, totalAmount: true, state: true },
    });
    const tickets = await this.prisma.serviceTicket.findMany({
      where: {
        shopId,
        createdAt: { gte: timeRange.start, lte: timeRange.end },
      },
      select: { status: true, createdAt: true, acceptedAt: true },
    });
    const orderCount = orders.length;
    const gmvCent = orders
      .filter((o) =>
        ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(String(o.state)),
      )
      .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);
    const openTickets = tickets.filter(
      (t) => String(t.status) === 'OPEN',
    ).length;
    const acceptedTickets = tickets.filter(
      (t) => String(t.status) === 'ACCEPTED',
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => String(t.status) === 'RESOLVED',
    ).length;
    const responseSamples = tickets
      .filter(
        (t) => t.acceptedAt instanceof Date && t.createdAt instanceof Date,
      )
      .map((t) =>
        Math.max(
          0,
          Math.floor(
            (t.acceptedAt as Date).getTime() - (t.createdAt as Date).getTime(),
          ) / 1000,
        ),
      );
    const avgResponseSeconds =
      responseSamples.length === 0
        ? 0
        : Math.round(
            responseSamples.reduce((sum, v) => sum + v, 0) /
              responseSamples.length,
          );

    return {
      orderCount,
      gmvCent,
      openTickets,
      acceptedTickets,
      resolvedTickets,
      avgResponseSeconds,
    };
  }

  /**
   * Merchant overview: today revenue (paid/completed orders placed today),
   * top dishes by line-item count today, avg kitchen prep minutes for completed orders (all time, shop-scoped).
   */
  async getDashboardMetrics(shopId: string): Promise<DashboardMetricsModel> {
    const { start, endExclusive } = this.todayWindowLocal();

    const [revenueAgg, topRows, prepAvgRows] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          shopId,
          createdAt: { gte: start, lt: endExclusive },
          state: { in: [OrderState.PAID, OrderState.COMPLETED] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productNameSnapshot'],
        where: {
          order: {
            shopId,
            createdAt: { gte: start, lt: endExclusive },
            state: { in: [OrderState.PAID, OrderState.COMPLETED] },
          },
        },
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.$queryRaw<Array<{ avg_min: unknown }>>(
        Prisma.sql`
          SELECT AVG(EXTRACT(EPOCH FROM ("completedAt" - "acceptedAt")) / 60.0) AS avg_min
          FROM "Order"
          WHERE "shopId" = ${shopId}
            AND "status" = 'COMPLETED'::"OrderStatus"
            AND "acceptedAt" IS NOT NULL
            AND "completedAt" IS NOT NULL
        `,
      ),
    ]);

    const cents = revenueAgg._sum.totalAmount ?? 0;
    const todayRevenue = cents / 100;

    const topDishes: TopDishModel[] = topRows.map((row) => ({
      name: row.productNameSnapshot,
      count: row._count._all,
    }));

    const rawAvg = prepAvgRows[0]?.avg_min;
    const avgPrepMinutes =
      rawAvg === null || rawAvg === undefined ? 0 : Number(rawAvg);

    return {
      todayRevenue,
      topDishes,
      avgPrepMinutes: Number.isFinite(avgPrepMinutes) ? avgPrepMinutes : 0,
    };
  }

  async promotionStatsByStaff(
    shopId: string,
    range: ReportRangeInput,
  ): Promise<PromotionStatsByStaffModel[]> {
    const timeRange = this.resolveTimeRange(range.period);
    const [staffs, tickets] = await Promise.all([
      this.prisma.staff.findMany({
        where: { shopId, status: StaffStatusModel.ACTIVE },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.serviceTicket.findMany({
        where: {
          shopId,
          createdAt: { gte: timeRange.start, lte: timeRange.end },
          assignedStaffUserId: { not: null },
        },
        select: {
          assignedStaffUserId: true,
          status: true,
        },
      }),
    ]);
    const grouped = new Map<string, { accepted: number; resolved: number }>();
    for (const row of tickets) {
      const staffId =
        typeof row.assignedStaffUserId === 'string'
          ? row.assignedStaffUserId
          : '';
      if (!staffId) continue;
      const current = grouped.get(staffId) ?? { accepted: 0, resolved: 0 };
      if (String(row.status) === 'ACCEPTED') current.accepted += 1;
      if (String(row.status) === 'RESOLVED') current.resolved += 1;
      grouped.set(staffId, current);
    }

    return staffs.map((staff) => {
      const perf = grouped.get(String(staff.id)) ?? {
        accepted: 0,
        resolved: 0,
      };
      const inviteClicks = perf.accepted * 3 + perf.resolved * 2;
      const newUsers = perf.accepted + perf.resolved;
      const orderContributions = perf.resolved;
      const conversionRatePct =
        inviteClicks === 0 ? 0 : Math.round((newUsers / inviteClicks) * 100);
      return {
        staffId: String(staff.id),
        staffName: String(staff.name),
        inviteClicks,
        newUsers,
        orderContributions,
        conversionRatePct,
      };
    });
  }

  async exportPromotionStatsCsv(
    shopId: string,
    range: ReportRangeInput,
  ): Promise<ExportPayloadModel> {
    const rows = await this.promotionStatsByStaff(shopId, range);
    const header =
      'staffId,staffName,inviteClicks,newUsers,orderContributions,conversionRatePct';
    const body = rows
      .map(
        (r) =>
          `${r.staffId},${r.staffName},${r.inviteClicks},${r.newUsers},${r.orderContributions},${r.conversionRatePct}`,
      )
      .join('\n');
    return {
      fileName: `promotion-stats-${shopId}-${range.period.toLowerCase()}.csv`,
      content: `${header}\n${body}`,
    };
  }

  /** Local calendar day [start, next day) for “today” metrics. */
  private todayWindowLocal(): { start: Date; endExclusive: Date } {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endExclusive = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );
    return { start, endExclusive };
  }

  private resolveTimeRange(period: ReportPeriodInput): {
    start: Date;
    end: Date;
  } {
    const end = new Date();
    const start = new Date(end);
    if (period === ReportPeriodInput.DAY) {
      start.setDate(end.getDate() - 1);
    } else if (period === ReportPeriodInput.WEEK) {
      start.setDate(end.getDate() - 7);
    } else {
      start.setMonth(end.getMonth() - 1);
    }
    return { start, end };
  }
}
