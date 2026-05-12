import { ForbiddenException } from '@nestjs/common';
import { AdminResolver } from './admin.resolver';

describe('AdminResolver permissions', () => {
  const baseService = {
    dashboard: jest.fn(),
    staffs: jest.fn(),
    createStaff: jest.fn(),
    updateStaff: jest.fn(),
    deleteStaff: jest.fn().mockResolvedValue(true),
    resetStaffPassword: jest
      .fn()
      .mockResolvedValue({ ok: true, temporaryPassword: 'Tmp1234' }),
    printers: jest.fn(),
    createPrinter: jest.fn(),
    updatePrinter: jest.fn(),
    deletePrinter: jest.fn(),
    testPrinter: jest.fn(),
    printJobs: jest.fn(),
    pendingShops: jest.fn(),
    approveShopApplication: jest.fn(),
    rejectShopApplication: jest.fn(),
    platformCoupons: jest.fn(),
    createPlatformCoupon: jest.fn(),
    runPrintRetryCycle: jest.fn(),
  };
  const jwtService = { sign: jest.fn() };

  function buildResolver() {
    return new AdminResolver(baseService as never, jwtService as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_SENSITIVE_OP_CODE = 'verify-123';
  });

  it('blocks vertical privilege escalation when role is customer', async () => {
    const resolver = buildResolver();
    expect(() =>
      resolver.deleteStaff(
        'staff_1',
        'shop_1',
        { code: 'verify-123' },
        'customer',
        ['staff:write'],
        'shop_1',
        'user_1',
      ),
    ).toThrow(new ForbiddenException('Manager role required'));
  });

  it('blocks horizontal privilege escalation when shop scope mismatches', async () => {
    const resolver = buildResolver();
    expect(() =>
      resolver.resetStaffPassword(
        'staff_1',
        'shop_b',
        { code: 'verify-123' },
        'manager',
        ['staff:write'],
        'shop_a',
        'manager_1',
      ),
    ).toThrow(new ForbiddenException('Shop scope mismatch'));
  });
});
