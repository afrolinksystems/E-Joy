import { StaffService } from './staff.service';
import * as bcrypt from 'bcryptjs';

describe('StaffService', () => {
  function buildService() {
    const state = { rows: [] as any[] };
    const prisma = {
      serviceTicket: {
        create: jest.fn().mockImplementation(async ({ data }: any) => {
          const row = {
            id: `ticket_${state.rows.length + 1}`,
            ...data,
            assignedStaffUserId: null,
            acceptedAt: null,
            resolvedAt: null,
            createdAt: new Date(),
          };
          state.rows.push(row);
          return row;
        }),
        findMany: jest.fn().mockImplementation(async () => state.rows),
        findUnique: jest
          .fn()
          .mockImplementation(
            async ({ where }: any) =>
              state.rows.find((r) => r.id === where.id) ?? null,
          ),
        updateMany: jest
          .fn()
          .mockImplementation(async ({ where, data }: any) => {
            const idx = state.rows.findIndex(
              (r) => r.id === where.id && r.status === where.status,
            );
            if (idx < 0) return { count: 0 };
            state.rows[idx] = { ...state.rows[idx], ...data };
            return { count: 1 };
          }),
      },
      staffNotification: {
        create: jest.fn().mockResolvedValue({
          id: 'n1',
          shopId: 'shop_1',
          recipientUserId: 'staff_broadcast',
          type: 'CALL',
          title: 'New call',
          content: 'Water',
          createdAt: new Date(),
          readAt: null,
        }),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order_1',
          shopId: 'shop_1',
        }),
      },
      printerConfig: {
        findFirst: jest.fn().mockResolvedValue({ id: 'printer_1' }),
      },
      printJob: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: `job_${state.rows.length + 1}`,
          orderId: data.orderId,
          printerId: data.printerId,
          status: data.status,
          retryCount: data.retryCount,
        })),
      },
    };
    const realtime = {
      publishServiceTicketUpdated: jest.fn().mockResolvedValue(undefined),
      publishPrintJobUpdated: jest.fn().mockResolvedValue(undefined),
    };
    return {
      svc: new StaffService(prisma as never, realtime as never),
      state,
      prisma,
    };
  }

  it('enforces OPEN -> ACCEPTED -> RESOLVED transitions', async () => {
    const { svc } = buildService();
    const ticket = await svc.callWaiter(
      { shopId: 'shop_1', tableId: 'A1', reason: 'Water' },
      'user_customer_1',
    );

    const invalidResolve = await svc.resolveServiceTicket(
      { ticketId: ticket.id },
      'staff_1',
    );
    expect(invalidResolve).toBeNull();

    const accepted = await svc.acceptServiceTicket(
      { ticketId: ticket.id },
      'staff_1',
    );
    expect(accepted?.status).toBe('ACCEPTED');
    expect(accepted?.assignedStaffUserId).toBe('staff_1');

    const resolvedByOther = await svc.resolveServiceTicket(
      { ticketId: ticket.id },
      'staff_2',
    );
    expect(resolvedByOther).toBeNull();

    const resolved = await svc.resolveServiceTicket(
      { ticketId: ticket.id },
      'staff_1',
    );
    expect(resolved?.status).toBe('RESOLVED');
  });

  it('allows only one winner on concurrent accept', async () => {
    const { svc } = buildService();
    const ticket = await svc.callWaiter(
      { shopId: 'shop_1', tableId: 'A2', reason: 'Bill' },
      'user_customer_2',
    );
    const [a, b] = await Promise.all([
      svc.acceptServiceTicket({ ticketId: ticket.id }, 'staff_a'),
      svc.acceptServiceTicket({ ticketId: ticket.id }, 'staff_b'),
    ]);
    const successCount = [a, b].filter(Boolean).length;
    expect(successCount).toBe(1);
  });

  it('marks notification as read', async () => {
    const { svc } = buildService();
    const ok = await svc.markNotificationRead(
      { notificationId: 'n1' },
      'staff_1',
    );
    expect(ok).toBe(true);
  });

  it('returns staff performance summary by period', async () => {
    const { svc } = buildService();
    const ticket = await svc.callWaiter(
      { shopId: 'shop_1', tableId: 'A3', reason: 'Need menu' },
      'user_customer_3',
    );
    await svc.acceptServiceTicket({ ticketId: ticket.id }, 'staff_1');
    await svc.resolveServiceTicket({ ticketId: ticket.id }, 'staff_1');
    const perf = await svc.myPerformance(
      'staff_1',
      { period: 'DAY' as any },
      'shop_1',
    );
    expect(perf.staffUserId).toBe('staff_1');
    expect(perf.handledCount).toBeGreaterThanOrEqual(1);
    expect(perf.points).toBeGreaterThan(0);
  });

  it('keeps call push latency p95 under 2s baseline', async () => {
    const { svc } = buildService();
    const samples: number[] = [];
    for (let i = 0; i < 80; i += 1) {
      const started = process.hrtime.bigint();
      await svc.callWaiter(
        { shopId: 'shop_1', tableId: `B${i}`, reason: 'Latency check' },
        `user_${i}`,
      );
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      samples.push(elapsedMs);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)];
    expect(p95).toBeLessThan(2000);
  });

  it('keeps print command latency p95 under 5s baseline', async () => {
    const { svc } = buildService();
    const samples: number[] = [];
    for (let i = 0; i < 60; i += 1) {
      const started = process.hrtime.bigint();
      await svc.reprintOrder(`order_${i}`, 'staff_1', 'shop_1');
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      samples.push(elapsedMs);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)];
    expect(p95).toBeLessThan(5000);
  });

  it('keeps staff api latency p95 under 500ms baseline', async () => {
    const { svc } = buildService();
    const samples: number[] = [];
    for (let i = 0; i < 120; i += 1) {
      const created = await svc.callWaiter(
        { shopId: 'shop_1', tableId: `C${i}`, reason: 'API latency' },
        `user_api_${i}`,
      );
      const started = process.hrtime.bigint();
      await svc.acceptServiceTicket({ ticketId: created.id }, 'staff_api');
      await svc.listServiceTickets('shop_1');
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      samples.push(elapsedMs);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)];
    expect(p95).toBeLessThan(500);
  });

  it('authenticates only active staff with matching bcrypt password', async () => {
    const hash = await bcrypt.hash('secret123', 10);
    const prisma = {
      staff: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'staff_1',
          shopId: 'shop_1',
          role: 'MANAGER',
          passwordHash: hash,
        }),
      },
    };
    const svc = new StaffService(prisma as never, {} as never);

    await expect(
      svc.authenticateStaff('0911000000', 'wrong'),
    ).resolves.toBeNull();
    await expect(
      svc.authenticateStaff('0911000000', 'secret123'),
    ).resolves.toMatchObject({
      id: 'staff_1',
      shopId: 'shop_1',
    });
    expect(prisma.staff.findFirst).toHaveBeenCalledWith({
      where: { phone: '0911000000', status: 'ACTIVE' },
    });
  });

  it('rejects inactive or missing staff during authentication', async () => {
    const prisma = {
      staff: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const svc = new StaffService(prisma as never, {} as never);

    await expect(
      svc.authenticateStaff('0911000000', 'secret123'),
    ).resolves.toBeNull();
  });
});
