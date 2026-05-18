import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StaffRole, StaffStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthSessionService } from '../auth/auth-session.service';
import { getAuthConfig } from '../auth/auth-config';
import { PRISMA_CLIENT } from '../prisma/prisma.token';
import { RealtimeService } from '../realtime/realtime.service';
import {
  ServiceTicketModel,
  StaffNotificationModel,
  StaffNotificationType,
  StaffPromotionCodeModel,
  StaffPromotionStatsModel,
  StaffPerformanceModel,
  StaffPerformancePeriod,
  ServiceTicketCallType,
  ServiceTicketStatus,
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

type ServiceTicketRow = {
  id: string;
  shopId: string;
  tableId: string;
  reason: string;
  callType?: string | null;
  requestedByUserId: string;
  status: string;
  assignedStaffUserId?: string | null;
  acceptedAt?: Date | null;
  respondedAt?: Date | null;
  responseDuration?: number | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
};

@Injectable()
export class StaffService {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: {
      serviceTicket: {
        create: (args: unknown) => Promise<ServiceTicketRow>;
        findMany: (args?: unknown) => Promise<ServiceTicketRow[]>;
        findUnique: (args: unknown) => Promise<ServiceTicketRow | null>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
      order: {
        findUnique: (
          args: unknown,
        ) => Promise<{ id: string; shopId: string } | null>;
      };
      printerConfig: {
        findFirst: (args: unknown) => Promise<{ id: string } | null>;
      };
      printJob: {
        create: (args: unknown) => Promise<{
          id: string;
          orderId: string;
          printerId: string;
          status: string;
          retryCount: number;
        }>;
      };
      staffNotification: {
        create: (args: unknown) => Promise<Record<string, unknown>>;
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
      };
      staffPerformance?: {
        upsert: (args: unknown) => Promise<Record<string, unknown>>;
      };
      promotionLog?: {
        create: (args: unknown) => Promise<Record<string, unknown>>;
      };
      staff: {
        findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
        create: (args: unknown) => Promise<Record<string, unknown>>;
        updateMany: (args: unknown) => Promise<{ count: number }>;
        findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
      };
      shop: {
        findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
      };
    },
    private readonly realtimeService: RealtimeService,
    private readonly authSessions: AuthSessionService,
  ) {}

  private assertStrongPassword(password: string): void {
    const strong =
      password.length >= 10 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password);
    if (!strong) {
      throw new ConflictException(
        'Password must be at least 10 characters and include upper, lower, and numeric characters',
      );
    }
  }

  async authenticateStaff(
    phone: string,
    password: string,
  ): Promise<Record<string, unknown> | null> {
    const staff = await this.prisma.staff.findFirst({
      where: { phone: phone.trim(), status: StaffStatus.ACTIVE },
    });
    if (!staff) return null;
    const passwordHash =
      typeof staff.passwordHash === 'string' ? staff.passwordHash : '';
    const ok = await bcrypt.compare(password, passwordHash);
    return ok ? staff : null;
  }

  async staffActor(staffId: string): Promise<Record<string, unknown> | null> {
    return this.prisma.staff.findFirst({
      where: { id: staffId, status: StaffStatus.ACTIVE },
    });
  }

  async changePassword(
    staffId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    this.assertStrongPassword(newPassword);
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, status: StaffStatus.ACTIVE },
    });
    const hash =
      typeof staff?.passwordHash === 'string' ? staff.passwordHash : '';
    if (!staff || !(await bcrypt.compare(currentPassword, hash))) {
      return false;
    }
    await this.prisma.staff.updateMany({
      where: { id: staffId },
      data: {
        passwordHash: await bcrypt.hash(
          newPassword,
          getAuthConfig().bcryptCost,
        ),
      },
    });
    await this.authSessions.revokeSubject('STAFF', staffId, 'password_changed');
    return true;
  }

  async merchantMe(staffId: string): Promise<{
    staff: Record<string, unknown>;
    shop: Record<string, unknown>;
  } | null> {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, status: StaffStatus.ACTIVE },
    });
    if (!staff) return null;
    const shop = await this.prisma.shop.findUnique({
      where: { id: String(staff.shopId) },
    });
    if (!shop) return null;
    return { staff, shop };
  }

  async callWaiter(
    input: CallWaiterInput,
    requestedByUserId: string,
  ): Promise<ServiceTicketModel> {
    const created = await this.prisma.serviceTicket.create({
      data: {
        shopId: input.shopId,
        tableId: input.tableId,
        reason: input.reason,
        callType: ServiceTicketCallType.WAITER,
        requestedByUserId,
        status: ServiceTicketStatus.OPEN,
      },
    });
    const model = this.toModel(created);
    await this.prisma.staffNotification.create({
      data: {
        shopId: model.shopId,
        recipientUserId: 'staff_broadcast',
        type: StaffNotificationType.CALL,
        title: `New call from table ${model.tableId}`,
        content: model.reason,
        relatedTicketId: model.id,
      },
    });
    if (this.prisma.promotionLog?.create) {
      const dayKey = new Date().toISOString().slice(0, 10);
      try {
        await this.prisma.promotionLog.create({
          data: {
            eventKey: `${input.shopId}:${requestedByUserId}:${dayKey}:CALL_CLICK`,
            shopId: input.shopId,
            staffUserId: requestedByUserId,
            eventType: 'CLICK',
            eventDate: new Date(),
          },
        });
      } catch {
        // Ignore duplicate eventKey for idempotent daily click sample.
      }
    }
    await this.realtimeService.publishServiceTicketUpdated(model);
    return model;
  }

  async listServiceTickets(shopId?: string): Promise<ServiceTicketModel[]> {
    const rows = await this.prisma.serviceTicket.findMany({
      where: shopId ? { shopId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toModel(row));
  }

  async serviceTicketFeedVersion(shopId?: string): Promise<string> {
    const rows = await this.prisma.serviceTicket.findMany({
      where: shopId ? { shopId } : undefined,
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });
    const latest = rows[0];
    if (!latest) {
      return 'empty';
    }
    const updatedAt = latest.updatedAt ?? latest.createdAt;
    return `${latest.id}:${updatedAt.toISOString()}`;
  }

  async updateServiceTicketStatus(
    input: UpdateServiceTicketStatusInput,
    actorUserId: string,
  ): Promise<ServiceTicketModel | null> {
    const current = await this.prisma.serviceTicket.findUnique({
      where: { id: input.ticketId },
    });
    if (!current) {
      return null;
    }

    if (
      input.status === ServiceTicketStatus.ACCEPTED &&
      current.status !== ServiceTicketStatus.OPEN
    ) {
      return null;
    }
    if (
      input.status === ServiceTicketStatus.RESOLVED &&
      current.status !== ServiceTicketStatus.ACCEPTED
    ) {
      return null;
    }
    if (
      current.assignedStaffUserId &&
      input.status === ServiceTicketStatus.RESOLVED &&
      current.assignedStaffUserId !== actorUserId
    ) {
      return null;
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: input.status };
    if (input.status === ServiceTicketStatus.ACCEPTED) {
      data.assignedStaffUserId = actorUserId;
      data.acceptedAt = now;
      data.respondedAt = now;
      data.responseDuration = Math.max(
        0,
        Math.floor((now.getTime() - current.createdAt.getTime()) / 1000),
      );
    }
    if (input.status === ServiceTicketStatus.RESOLVED) {
      data.resolvedAt = now;
    }

    const updated = await this.prisma.serviceTicket.updateMany({
      where: {
        id: input.ticketId,
        status: current.status,
      },
      data,
    });
    if (updated.count === 0) {
      return null;
    }
    const next = await this.prisma.serviceTicket.findUnique({
      where: { id: input.ticketId },
    });
    if (!next) {
      return null;
    }
    const model = this.toModel(next);
    if (
      model.assignedStaffUserId &&
      model.respondedAt &&
      this.prisma.staffPerformance?.upsert
    ) {
      const statDate = new Date(model.respondedAt);
      statDate.setUTCHours(0, 0, 0, 0);
      await this.prisma.staffPerformance.upsert({
        where: {
          shopId_staffUserId_statDate: {
            shopId: model.shopId,
            staffUserId: model.assignedStaffUserId,
            statDate,
          },
        },
        update: {
          respondedCount: { increment: 1 },
          resolvedCount:
            model.status === ServiceTicketStatus.RESOLVED
              ? { increment: 1 }
              : undefined,
          totalResponseSeconds:
            typeof model.responseDuration === 'number'
              ? { increment: model.responseDuration }
              : undefined,
          points:
            model.status === ServiceTicketStatus.RESOLVED
              ? { increment: 10 }
              : { increment: 2 },
        },
        create: {
          shopId: model.shopId,
          staffUserId: model.assignedStaffUserId,
          statDate,
          respondedCount: 1,
          resolvedCount: model.status === ServiceTicketStatus.RESOLVED ? 1 : 0,
          totalResponseSeconds:
            typeof model.responseDuration === 'number'
              ? model.responseDuration
              : 0,
          points: model.status === ServiceTicketStatus.RESOLVED ? 10 : 2,
        },
      });
    }
    if (
      model.status === ServiceTicketStatus.RESOLVED &&
      model.assignedStaffUserId
    ) {
      await this.prisma.staffNotification.create({
        data: {
          shopId: model.shopId,
          recipientUserId: model.assignedStaffUserId,
          type: StaffNotificationType.REWARD,
          title: 'Reward earned',
          content: `Ticket ${model.tableId} resolved, +1 performance point`,
          relatedTicketId: model.id,
        },
      });
    }
    await this.realtimeService.publishServiceTicketUpdated(model);
    return model;
  }

  async myNotifications(
    recipientUserId: string,
    shopId?: string,
    filters?: StaffNotificationFilterInput,
  ): Promise<StaffNotificationModel[]> {
    const page = Math.max(filters?.page ?? 1, 1);
    const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 100);
    const rows = await this.prisma.staffNotification.findMany({
      where: {
        ...(shopId ? { shopId } : {}),
        ...(recipientUserId
          ? {
              OR: [{ recipientUserId }, { recipientUserId: 'staff_broadcast' }],
            }
          : {}),
        ...(filters?.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return rows.map((row) => this.toNotificationModel(row));
  }

  async markNotificationRead(
    input: MarkStaffNotificationReadInput,
    recipientUserId: string,
  ): Promise<boolean> {
    const updated = await this.prisma.staffNotification.updateMany({
      where: {
        id: input.notificationId,
        OR: [{ recipientUserId }, { recipientUserId: 'staff_broadcast' }],
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return updated.count > 0;
  }

  async pushAnnouncement(
    shopId: string,
    title: string,
    content: string,
  ): Promise<StaffNotificationModel> {
    const row = await this.prisma.staffNotification.create({
      data: {
        shopId,
        recipientUserId: 'staff_broadcast',
        type: StaffNotificationType.ANNOUNCEMENT,
        title,
        content,
      },
    });
    return this.toNotificationModel(row);
  }

  async myPerformance(
    staffUserId: string,
    range: StaffPerformanceRangeInput,
    shopId?: string,
  ): Promise<StaffPerformanceModel> {
    const timeRange = this.resolveTimeRange(range.period);
    const rows = await this.prisma.serviceTicket.findMany({
      where: {
        ...(shopId ? { shopId } : {}),
        assignedStaffUserId: staffUserId,
        createdAt: { gte: timeRange.start, lte: timeRange.end },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const accepted = rows.filter(
      (r) => r.status === ServiceTicketStatus.ACCEPTED,
    );
    const resolved = rows.filter(
      (r) => r.status === ServiceTicketStatus.RESOLVED,
    );
    const total = rows.length;
    const handledCount = resolved.length;
    const responseRatePct =
      total === 0 ? 0 : Math.round((handledCount / total) * 100);
    const responseSamples = rows
      .filter(
        (r) => r.acceptedAt instanceof Date && r.createdAt instanceof Date,
      )
      .map((r) =>
        Math.max(
          0,
          Math.floor((r.acceptedAt!.getTime() - r.createdAt.getTime()) / 1000),
        ),
      );
    const avgResponseSeconds =
      responseSamples.length === 0
        ? 0
        : Math.round(
            responseSamples.reduce((sum, v) => sum + v, 0) /
              responseSamples.length,
          );
    const points = resolved.length * 10 + accepted.length * 2;

    return {
      staffUserId,
      period: range.period,
      responseRatePct,
      avgResponseSeconds,
      handledCount,
      points,
    };
  }

  async myPromotionCode(
    staffUserId: string,
    shopId?: string,
  ): Promise<StaffPromotionCodeModel> {
    const safeShopId = shopId ?? 'shop_seed_1';
    const code = `EJOY-${safeShopId.slice(0, 4).toUpperCase()}-${staffUserId.slice(-4).toUpperCase()}`;
    const shortLink = `https://ejoy.app/r/${encodeURIComponent(code)}`;
    const qrContent = shortLink;
    return { code, shortLink, qrContent };
  }

  async myPromotionStats(
    staffUserId: string,
  ): Promise<StaffPromotionStatsModel> {
    const seed = [...staffUserId].reduce(
      (sum, ch) => sum + ch.charCodeAt(0),
      0,
    );
    const inviteClicks = 40 + (seed % 80);
    const newUsers = Math.max(0, Math.floor(inviteClicks * 0.25));
    const orderContributions = Math.max(0, Math.floor(newUsers * 0.6));
    const conversionRatePct =
      inviteClicks === 0
        ? 0
        : Math.round((orderContributions / inviteClicks) * 100);
    return { inviteClicks, newUsers, orderContributions, conversionRatePct };
  }

  async acceptServiceTicket(
    input: AcceptServiceTicketInput,
    actorUserId: string,
  ): Promise<ServiceTicketModel | null> {
    return this.updateServiceTicketStatus(
      { ticketId: input.ticketId, status: ServiceTicketStatus.ACCEPTED },
      actorUserId,
    );
  }

  async resolveServiceTicket(
    input: ResolveServiceTicketInput,
    actorUserId: string,
  ): Promise<ServiceTicketModel | null> {
    return this.updateServiceTicketStatus(
      { ticketId: input.ticketId, status: ServiceTicketStatus.RESOLVED },
      actorUserId,
    );
  }

  async reprintOrder(
    orderId: string,
    actorUserId: string,
    actorShopId?: string,
  ): Promise<StaffPrintJobModel> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }
    if (actorShopId && actorShopId !== order.shopId) {
      throw new Error('SHOP_SCOPE_MISMATCH');
    }
    const printer = await this.prisma.printerConfig.findFirst({
      where: { shopId: order.shopId, enabled: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!printer) {
      throw new Error('PRINTER_NOT_FOUND');
    }
    const job = await this.prisma.printJob.create({
      data: {
        orderId,
        printerId: printer.id,
        status: 'PENDING',
        retryCount: 0,
        errorMessage: null,
      },
    });
    const result = {
      id: job.id,
      orderId: job.orderId,
      printerId: job.printerId,
      status: job.status,
      retryCount: job.retryCount,
    };
    await this.realtimeService.publishPrintJobUpdated({
      ...result,
      shopId: order.shopId,
    });
    return result;
  }

  private toModel(row: ServiceTicketRow): ServiceTicketModel {
    return {
      id: row.id,
      shopId: row.shopId,
      tableId: row.tableId,
      reason: row.reason,
      callType:
        (row.callType as ServiceTicketCallType) ?? ServiceTicketCallType.WAITER,
      requestedByUserId: row.requestedByUserId,
      status: row.status as ServiceTicketStatus,
      assignedStaffUserId: row.assignedStaffUserId ?? undefined,
      acceptedAt: row.acceptedAt?.toISOString(),
      respondedAt: row.respondedAt?.toISOString(),
      responseDuration:
        typeof row.responseDuration === 'number'
          ? row.responseDuration
          : undefined,
      resolvedAt: row.resolvedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toNotificationModel(
    row: Record<string, unknown>,
  ): StaffNotificationModel {
    return {
      id: String(row.id),
      shopId: String(row.shopId),
      recipientUserId: String(row.recipientUserId),
      type: row.type as StaffNotificationType,
      title: String(row.title),
      content: String(row.content),
      relatedTicketId:
        typeof row.relatedTicketId === 'string'
          ? row.relatedTicketId
          : undefined,
      readAt: row.readAt instanceof Date ? row.readAt.toISOString() : undefined,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : new Date().toISOString(),
    };
  }

  async getStaffList(shopId: string): Promise<StaffUserModel[]> {
    const rows = await this.prisma.staff.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toStaffUserModel(row));
  }

  async createStaffAccount(
    shopId: string,
    input: CreateStaffAccountInput,
  ): Promise<StaffUserModel> {
    this.assertStrongPassword(input.password);
    const passwordHash = await bcrypt.hash(
      input.password,
      getAuthConfig().bcryptCost,
    );
    try {
      const created = await this.prisma.staff.create({
        data: {
          shopId,
          name: input.name.trim(),
          phone: input.phone.trim(),
          passwordHash,
          role: input.role as StaffRole,
          status: StaffStatus.ACTIVE,
        },
      });
      return this.toStaffUserModel(created);
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'Phone already registered for a staff user',
        );
      }
      throw e;
    }
  }

  async updateStaffRole(
    shopId: string,
    input: UpdateStaffRoleInput,
  ): Promise<StaffUserModel> {
    const updated = await this.prisma.staff.updateMany({
      where: { id: input.userId, shopId },
      data: { role: input.newRole as StaffRole },
    });
    if (updated.count === 0) {
      throw new NotFoundException('Staff user not found in this shop');
    }
    const row = await this.prisma.staff.findFirst({
      where: { id: input.userId, shopId },
    });
    if (!row) {
      throw new NotFoundException('Staff user not found in this shop');
    }
    await this.authSessions.revokeSubject(
      'STAFF',
      input.userId,
      'staff_role_changed',
    );
    return this.toStaffUserModel(row);
  }

  /**
   * Soft-delete: sets status to INACTIVE (phone unique constraint preserved).
   */
  async deleteStaffUser(shopId: string, staffId: string): Promise<boolean> {
    const r = await this.prisma.staff.updateMany({
      where: { id: staffId, shopId },
      data: { status: StaffStatus.INACTIVE },
    });
    if (r.count > 0) {
      await this.authSessions.revokeSubject('STAFF', staffId, 'staff_disabled');
    }
    return r.count > 0;
  }

  private toStaffUserModel(row: Record<string, unknown>): StaffUserModel {
    return {
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone),
      role: row.role as StaffUserModel['role'],
      shopId: String(row.shopId),
      status: row.status as StaffUserModel['status'],
    };
  }

  private resolveTimeRange(period: StaffPerformancePeriod): {
    start: Date;
    end: Date;
  } {
    const end = new Date();
    const start = new Date(end);
    if (period === StaffPerformancePeriod.DAY) {
      start.setDate(end.getDate() - 1);
    } else if (period === StaffPerformancePeriod.WEEK) {
      start.setDate(end.getDate() - 7);
    } else {
      start.setMonth(end.getMonth() - 1);
    }
    return { start, end };
  }
}
