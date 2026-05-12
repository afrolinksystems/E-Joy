import { ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { StaffStatusModel } from './admin.types';

describe('AdminService sensitive verification', () => {
  function buildService() {
    const prisma = {
      order: {
        count: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
      orderItem: { groupBy: jest.fn() },
      $queryRaw: jest.fn(),
      serviceTicket: { count: jest.fn(), findMany: jest.fn() },
      staff: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      printerConfig: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      printJob: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      shopApplication: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      platformCoupon: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      performanceRule: {
        findUnique: jest.fn(),
        upsert: jest
          .fn()
          .mockImplementation(async ({ where, create }: any) => ({
            id: 'rule_1',
            shopId: where.shopId ?? create.shopId,
            responseRateWeight: create.responseRateWeight,
            avgResponseSecondsWeight: create.avgResponseSecondsWeight,
            resolvedCountWeight: create.resolvedCountWeight,
            rewardRulesJson: create.rewardRulesJson ?? null,
          })),
      },
    };
    const eventProducer = { publish: jest.fn() };
    const realtime = {
      publishPrintJobUpdated: jest.fn(),
      publishServiceTicketUpdated: jest.fn(),
    };
    const productService = {
      listProducts: jest.fn().mockResolvedValue([]),
    };
    return {
      service: new AdminService(
        prisma as never,
        eventProducer as never,
        realtime as never,
        productService as never,
      ),
      prisma,
    };
  }

  beforeEach(() => {
    process.env.ADMIN_SENSITIVE_OP_CODE = 'verify-123';
  });

  it('rejects reset password when verification code is invalid', async () => {
    const { service } = buildService();
    await expect(
      service.resetStaffPassword('staff_1', 'shop_1', 'manager_1', {
        code: 'wrong-code',
        reason: 'test',
      }),
    ).rejects.toThrow(new ForbiddenException('Second verification failed'));
  });

  it('applies status role phone and pagination filters for staff list', async () => {
    const { service, prisma } = buildService();
    prisma.staff.findMany.mockResolvedValueOnce([]);
    await service.staffs('shop_1', {
      status: StaffStatusModel.ACTIVE,
      role: 'WAITER',
      phoneKeyword: '188',
      page: 2,
      pageSize: 10,
    });
    expect(prisma.staff.findMany).toHaveBeenCalledWith({
      where: {
        shopId: 'shop_1',
        status: StaffStatusModel.ACTIVE,
        role: 'WAITER',
        phone: { contains: '188' },
      },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
  });

  it('rejects performance rule when weight sum is not 100', async () => {
    const { service } = buildService();
    await expect(
      service.updatePerformanceRule('shop_1', {
        responseRateWeight: 50,
        avgResponseSecondsWeight: 30,
        resolvedCountWeight: 10,
      }),
    ).rejects.toThrow(new ForbiddenException('Weight sum must equal 100'));
  });

  it('upserts performance rule when weight sum equals 100', async () => {
    const { service } = buildService();
    const result = await service.updatePerformanceRule('shop_1', {
      responseRateWeight: 40,
      avgResponseSecondsWeight: 30,
      resolvedCountWeight: 30,
      rewardRulesJson: '{"bonus":{"tier1":100}}',
    });
    expect(result.shopId).toBe('shop_1');
    expect(result.responseRateWeight).toBe(40);
    expect(result.rewardRulesJson).toContain('tier1');
  });

  it('getDashboardMetrics uses shop-scoped aggregates', async () => {
    const { service, prisma } = buildService();
    prisma.order.aggregate.mockResolvedValueOnce({
      _sum: { totalAmount: 15_050 },
    });
    prisma.orderItem.groupBy.mockResolvedValueOnce([
      { productNameSnapshot: 'Injera', _count: { _all: 4 } },
      { productNameSnapshot: 'Coffee', _count: { _all: 2 } },
    ]);
    prisma.$queryRaw.mockResolvedValueOnce([{ avg_min: 8.25 }]);

    const m = await service.getDashboardMetrics('test-shop-001');

    expect(m.todayRevenue).toBe(150.5);
    expect(m.topDishes).toEqual([
      { name: 'Injera', count: 4 },
      { name: 'Coffee', count: 2 },
    ]);
    expect(m.avgPrepMinutes).toBe(8.25);
    expect(prisma.order.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ shopId: 'test-shop-001' }),
      }),
    );
    expect(prisma.orderItem.groupBy).toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('builds business report aggregate', async () => {
    const { service, prisma } = buildService();
    prisma.order.findMany.mockResolvedValueOnce([
      { id: 'o1', state: 'PAID', totalAmount: 1000 },
      { id: 'o2', state: 'COMPLETED', totalAmount: 2000 },
      { id: 'o3', state: 'CANCELLED', totalAmount: 9999 },
    ]);
    prisma.serviceTicket.findMany.mockResolvedValueOnce([
      {
        status: 'OPEN',
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
        acceptedAt: null,
      },
      {
        status: 'RESOLVED',
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
        acceptedAt: new Date('2026-04-02T00:01:00.000Z'),
      },
    ]);
    const report = await service.businessReport('shop_1', {
      period: 'DAY' as any,
    });
    expect(report.orderCount).toBe(3);
    expect(report.gmvCent).toBe(3000);
    expect(report.openTickets).toBe(1);
    expect(report.resolvedTickets).toBe(1);
    expect(report.avgResponseSeconds).toBe(60);
  });

  it('exports promotion stats as csv', async () => {
    const { service, prisma } = buildService();
    prisma.staff.findMany.mockResolvedValueOnce([
      { id: 's1', name: 'Alice', status: 'ACTIVE' },
    ]);
    prisma.serviceTicket.findMany.mockResolvedValueOnce([
      { assignedStaffUserId: 's1', status: 'ACCEPTED' },
      { assignedStaffUserId: 's1', status: 'RESOLVED' },
    ]);
    const csv = await service.exportPromotionStatsCsv('shop_1', {
      period: 'WEEK' as any,
    });
    expect(csv.fileName).toContain('shop_1');
    expect(csv.content).toContain('staffId,staffName');
    expect(csv.content).toContain('s1,Alice');
  });
});
