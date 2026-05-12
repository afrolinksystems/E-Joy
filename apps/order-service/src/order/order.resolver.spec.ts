import { ForbiddenException } from '@nestjs/common';
import { DeliveryFeeType } from './order.types';
import { OrderResolver } from './order.resolver';

describe('OrderResolver permissions', () => {
  const orderService = {
    updateDeliveryConfig: jest.fn().mockResolvedValue({
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      deliveryRadius: 3,
      deliveryFeeType: DeliveryFeeType.FIXED,
      fixedFee: 1000,
      freeDeliveryThreshold: undefined,
    }),
  };

  const pubSub = {
    asyncIterableIterator: jest.fn(),
  };

  function buildResolver() {
    return new OrderResolver(orderService as never, pubSub as never);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_SENSITIVE_OP_CODE = 'verify-123';
  });

  it('blocks vertical privilege escalation for delivery config update', async () => {
    const resolver = buildResolver();
    expect(() =>
      resolver.updateDeliveryConfig(
        'shop_1',
        { deliveryEnabled: true, pickupEnabled: true, dineInEnabled: true },
        { code: 'verify-123' },
        'customer',
        ['delivery:write'],
        'shop_1',
        'user_1',
      ),
    ).toThrow(new ForbiddenException('Manager role required'));
  });

  it('blocks horizontal privilege escalation for cross-shop update', async () => {
    const resolver = buildResolver();
    expect(() =>
      resolver.updateDeliveryConfig(
        'shop_b',
        { deliveryEnabled: true, pickupEnabled: true, dineInEnabled: true },
        { code: 'verify-123' },
        'manager',
        ['delivery:write'],
        'shop_a',
        'manager_1',
      ),
    ).toThrow(new ForbiddenException('Shop scope mismatch'));
  });
});
