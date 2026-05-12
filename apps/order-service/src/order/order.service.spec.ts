import { ConflictException } from '@nestjs/common';
import { OrderService } from './order.service';
import { DeliveryType, PaymentMethod } from './order.types';

function inventoryStub() {
  return { atomicDeduct: jest.fn().mockResolvedValue(true) };
}

function tableServiceStub() {
  return { getTableById: jest.fn().mockResolvedValue(null) } as never;
}

function pubSubStub() {
  return { publish: jest.fn().mockResolvedValue(undefined) } as never;
}

function telebirrStub() {
  return {
    isConfigured: jest.fn().mockReturnValue(false),
    createH5Order: jest.fn(),
    parseNotifyPayload: jest.fn(),
  } as never;
}

describe('OrderService.createOrder', () => {
  const baseInput = {
    shopId: 'shop_1',
    tableId: 'table_1',
    idempotencyKey: 'idem_1',
    paymentMethod: PaymentMethod.TELEBIRR,
    items: [{ productId: 'p1', amount: 2, remark: '' }],
    couponCode: undefined,
    note: undefined,
  };

  const paymentProvider = {
    verifyTelebirrCallbackSignature: jest.fn().mockReturnValue(true),
  };

  function buildService(mockPrisma: Record<string, unknown>) {
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const paymentMetrics = {
      markCallbackSuccess: jest.fn(),
      markCallbackFailed: jest.fn(),
      markReplayRejected: jest.fn(),
      markTxnConflict: jest.fn(),
    };
    const orderMock =
      typeof mockPrisma.order === 'object' && mockPrisma.order !== null
        ? (mockPrisma.order as Record<string, unknown>)
        : {};
    const prisma = {
      ...mockPrisma,
      order: {
        findFirst: jest.fn().mockResolvedValue(null),
        ...orderMock,
      },
    };
    return new OrderService(
      prisma as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
  }

  it('returns validation error when items are empty', async () => {
    const service = buildService({});
    const result = await service.createOrder({ ...baseInput, items: [] });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('ORDER_VALIDATION_FAILED');
  });

  it('returns idempotency conflict for same key with different payload', async () => {
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o_1',
          orderNo: 'ORD_1',
          state: 'PENDING_PAYMENT',
          paymentState: 'PENDING',
          totalAmount: 1000,
          requestHash: 'another_hash',
        }),
      },
    });
    const result = await service.createOrder(baseInput);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('returns existing order for idempotent replay with same payload', async () => {
    const probe = buildService({ order: { findUnique: jest.fn() } });
    const requestHash = (probe as any).buildRequestHash(baseInput);
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o_replay',
          orderNo: 'ORD_REPLAY',
          state: 'PENDING_PAYMENT',
          paymentState: 'PENDING',
          totalAmount: 1000,
          requestHash,
        }),
      },
    });

    const result = await service.createOrder(baseInput);
    expect(result.ok).toBe(true);
    expect(result.order?.id).toBe('o_replay');
  });

  it('returns inventory insufficient when Redis stock conflicts', async () => {
    const paymentProvider = {
      verifyTelebirrCallbackSignature: jest.fn().mockReturnValue(true),
    };
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const paymentMetrics = {
      markCallbackSuccess: jest.fn(),
      markCallbackFailed: jest.fn(),
      markReplayRejected: jest.fn(),
      markTxnConflict: jest.fn(),
    };
    const service = new OrderService(
      {
        order: {
          findUnique: jest.fn().mockResolvedValue(null),
          findFirst: jest.fn().mockResolvedValue(null),
        },
        diningTable: {
          findFirst: jest.fn().mockResolvedValue({ id: 'table_1' }),
        },
        product: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'p1', name: 'Chicken', unitPrice: 500, active: true },
            ]),
        },
      } as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      {
        atomicDeduct: jest
          .fn()
          .mockRejectedValue(new ConflictException('Product p1 out of stock')),
      } as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
    const result = await service.createOrder(baseInput);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('INVENTORY_INSUFFICIENT');
  });

  it('returns existing order on concurrent duplicate idempotency (P2002)', async () => {
    const paymentProvider = {
      verifyTelebirrCallbackSignature: jest.fn().mockReturnValue(true),
    };
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const paymentMetrics = {
      markCallbackSuccess: jest.fn(),
      markCallbackFailed: jest.fn(),
      markReplayRejected: jest.fn(),
      markTxnConflict: jest.fn(),
    };
    const probe = new OrderService(
      {
        order: {
          findUnique: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
    const requestHash = (probe as any).buildRequestHash(baseInput);
    const dupErr = Object.assign(new Error('Unique constraint'), {
      code: 'P2002',
    });
    const service = new OrderService(
      {
        order: {
          findFirst: jest.fn().mockResolvedValue(null),
          findUnique: jest
            .fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({
              id: 'o_race',
              orderNo: 'ORD_RACE',
              state: 'PENDING_PAYMENT',
              paymentState: 'PENDING',
              totalAmount: 1000,
              requestHash,
            }),
        },
        diningTable: {
          findFirst: jest.fn().mockResolvedValue({ id: 'table_1' }),
        },
        product: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'p1', name: 'Chicken', unitPrice: 500, active: true },
            ]),
        },
        coupon: { findFirst: jest.fn().mockResolvedValue(null) },
        $transaction: jest.fn().mockRejectedValue(dupErr),
      } as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
    const result = await service.createOrder(baseInput);
    expect(result.ok).toBe(true);
    expect(result.order?.id).toBe('o_race');
  });

  it('creates order successfully', async () => {
    const service = buildService({
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      diningTable: {
        findFirst: jest.fn().mockResolvedValue({ id: 'table_1' }),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'p1', name: 'Chicken', unitPrice: 500, active: true },
          ]),
      },
      coupon: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            upsert: jest.fn().mockResolvedValue({ id: 'user_placeholder' }),
          },
          coupon: {
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          couponUsageLog: {
            create: jest.fn(),
          },
          orderStatusLog: {
            create: jest.fn(),
          },
          order: {
            create: jest.fn().mockResolvedValue({
              id: 'o_created',
              orderNo: 'ORD_CREATED',
              state: 'PENDING_PAYMENT',
              paymentState: 'PENDING',
              totalAmount: 1000,
            }),
          },
        };
        return cb(tx);
      }),
    });
    const result = await service.createOrder(baseInput);
    expect(result.ok).toBe(true);
    expect(result.order?.id).toBe('o_created');
    expect(result.order?.totalAmount).toBe(1000);
  });

  it('appends to an existing unpaid dine-in order and does not publish tableStatusChanged', async () => {
    const pub = { publish: jest.fn().mockResolvedValue(undefined) };
    const activeOrder = {
      id: 'o_open',
      shopId: 'shop_1',
      tableId: 'table_1',
      userId: 'user_placeholder',
      status: 'PENDING',
      state: 'PENDING_PAYMENT',
      deliveryType: DeliveryType.DINE_IN,
      paymentMethod: PaymentMethod.TELEBIRR,
      subtotalAmount: 1000,
      discountAmount: 0,
      deliveryFee: null,
      pricingSnapshot: {
        items: [],
        subtotalAmount: 1000,
        totalAmount: 1000,
      },
    };
    const service = new OrderService(
      {
        order: {
          findUnique: jest.fn().mockResolvedValue(null),
          findFirst: jest.fn().mockResolvedValue(activeOrder),
        },
        diningTable: {
          findFirst: jest.fn().mockResolvedValue({ id: 'table_1' }),
        },
        product: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'p1', name: 'Chicken', unitPrice: 500, active: true },
            ]),
        },
        $transaction: jest.fn().mockImplementation(async (cb: any) => {
          const tx = {
            order: {
              findFirst: jest.fn().mockResolvedValue({
                ...activeOrder,
                pricingSnapshot: activeOrder.pricingSnapshot,
              }),
              update: jest.fn().mockResolvedValue({}),
              findUniqueOrThrow: jest.fn().mockResolvedValue({
                id: 'o_open',
                orderNo: 'ORD_OPEN',
                state: 'PENDING_PAYMENT',
                paymentState: 'PENDING',
                totalAmount: 2000,
                deliveryType: DeliveryType.DINE_IN,
              }),
            },
            orderItem: { create: jest.fn().mockResolvedValue({}) },
            orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
          };
          return cb(tx);
        }),
      } as never,
      paymentProvider as never,
      { publish: jest.fn().mockResolvedValue(undefined) } as never,
      {
        markCallbackSuccess: jest.fn(),
        markCallbackFailed: jest.fn(),
        markReplayRejected: jest.fn(),
        markTxnConflict: jest.fn(),
      } as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pub as never,
    );
    const result = await service.createOrder(baseInput);
    expect(result.ok).toBe(true);
    expect(result.order?.id).toBe('o_open');
    expect(result.order?.totalAmount).toBe(2000);
    expect(pub.publish).not.toHaveBeenCalled();
  });

  it('returns coupon limit exceeded when atomic update fails', async () => {
    const service = buildService({
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      diningTable: {
        findFirst: jest.fn().mockResolvedValue({ id: 'table_1' }),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'p1', name: 'Chicken', unitPrice: 500, active: true },
          ]),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const tx = {
          user: { upsert: jest.fn().mockResolvedValue({ id: 'u1' }) },
          coupon: {
            findFirst: jest.fn().mockResolvedValue({
              id: 'c1',
              usageLimit: 1,
              discountValue: 10,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            update: jest.fn(),
          },
          order: { create: jest.fn() },
          couponUsageLog: { create: jest.fn() },
          orderStatusLog: { create: jest.fn() },
        };
        return cb(tx);
      }),
    });

    const result = await service.createOrder({
      ...baseInput,
      couponCode: 'SAVE10',
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('COUPON_LIMIT_EXCEEDED');
  });

  it('rejects delivery order when address does not belong to user', async () => {
    const service = buildService({
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'p1', name: 'Chicken', unitPrice: 500, active: true },
          ]),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const tx = {
          user: { upsert: jest.fn().mockResolvedValue({ id: 'u1' }) },
          coupon: {
            findFirst: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          shopDeliveryConfig: {
            findUnique: jest.fn().mockResolvedValue({
              deliveryEnabled: true,
              fixedFee: 500,
            }),
          },
          userAddress: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          order: { create: jest.fn() },
          couponUsageLog: { create: jest.fn() },
          orderStatusLog: { create: jest.fn() },
        };
        return cb(tx);
      }),
    });
    const result = await service.createOrder({
      ...baseInput,
      deliveryType: DeliveryType.DELIVERY,
      addressId: 'addr_not_owned',
      tableId: undefined,
      tableNumber: undefined,
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('ORDER_VALIDATION_FAILED');
  });
});

describe('OrderService.initiatePayment', () => {
  function buildService(mockPrisma: Record<string, unknown>) {
    const paymentProvider = {
      verifyTelebirrCallbackSignature: jest.fn().mockReturnValue(true),
    };
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const paymentMetrics = {
      markCallbackSuccess: jest.fn(),
      markCallbackFailed: jest.fn(),
      markReplayRejected: jest.fn(),
      markTxnConflict: jest.fn(),
    };
    return new OrderService(
      mockPrisma as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
  }

  it('returns invalid transition for non-pending orders', async () => {
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({ id: 'o1', state: 'PAID' }),
      },
      $transaction: jest.fn(),
    });
    const result = await service.initiatePayment({
      orderId: 'o1',
      channel: 'TELEBIRR_APP' as any,
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('ORDER_STATE_INVALID_TRANSITION');
  });

  it('creates payment attempt and returns raw request', async () => {
    const service = buildService({
      order: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'o1', state: 'PENDING_PAYMENT' }),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const tx = {
          paymentAttempt: {
            create: jest.fn().mockResolvedValue({
              id: 'pa1',
              channel: 'TELEBIRR_APP',
              state: 'INITIATED',
            }),
          },
          order: { update: jest.fn().mockResolvedValue({}) },
          orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      }),
    });
    const result = await service.initiatePayment({
      orderId: 'o1',
      channel: 'TELEBIRR_APP' as any,
    });
    expect(result.ok).toBe(true);
    expect(result.payment?.id).toBe('pa1');
    expect(result.rawRequest).toContain('PAYMENT_REQUEST_TELEBIRR_APP_o1');
  });
});

describe('OrderService.confirmPaymentCallback', () => {
  function buildService(
    mockPrisma: Record<string, unknown>,
    verifySignature = true,
  ) {
    const paymentProvider = {
      verifyTelebirrCallbackSignature: jest
        .fn()
        .mockReturnValue(verifySignature),
    };
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const paymentMetrics = {
      markCallbackSuccess: jest.fn(),
      markCallbackFailed: jest.fn(),
      markReplayRejected: jest.fn(),
      markTxnConflict: jest.fn(),
    };
    return new OrderService(
      mockPrisma as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
  }

  it('is idempotent for repeated successful callback', async () => {
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          orderNo: 'ORD1',
          state: 'PAID',
          paymentState: 'SUCCESS',
          totalAmount: 1000,
        }),
      },
      paymentAttempt: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'pa1',
          orderId: 'o1',
          providerTxnId: 'txn1',
          state: 'SUCCESS',
        }),
      },
      paymentCallbackReceipt: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(),
    });
    const result = await service.confirmPaymentCallback({
      orderId: 'o1',
      providerTxnId: 'txn1',
      callbackStatus: 'SUCCESS',
      signature: 'sig',
      rawPayload: JSON.stringify({
        ok: true,
        nonce: 'n1',
        timestamp: Date.now(),
      }),
    });
    expect(result.ok).toBe(true);
    expect(result.order?.state).toBe('PAID');
  });

  it('ignores late failed callback after order already paid', async () => {
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          orderNo: 'ORD1',
          state: 'PAID',
          paymentState: 'SUCCESS',
          totalAmount: 1000,
          paidAt: new Date(),
        }),
      },
      paymentAttempt: { findFirst: jest.fn().mockResolvedValue(null) },
      paymentCallbackReceipt: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const tx = {
          paymentCallbackReceipt: { create: jest.fn().mockResolvedValue({}) },
          paymentAttempt: {
            create: jest.fn().mockResolvedValue({ id: 'pa2' }),
            update: jest.fn().mockResolvedValue({}),
          },
          order: {
            update: jest.fn().mockResolvedValue({
              id: 'o1',
              orderNo: 'ORD1',
              state: 'PAID',
              paymentState: 'SUCCESS',
              totalAmount: 1000,
            }),
          },
          orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      }),
    });
    const result = await service.confirmPaymentCallback({
      orderId: 'o1',
      providerTxnId: 'txn-late-fail',
      callbackStatus: 'FAILED',
      signature: 'sig',
      rawPayload: JSON.stringify({
        status: 'FAILED',
        nonce: 'n2',
        timestamp: Date.now(),
      }),
    });
    expect(result.ok).toBe(true);
    expect(result.order?.state).toBe('PAID');
  });

  it('rejects stale callback payload timestamp', async () => {
    const service = buildService(
      {
        order: { findUnique: jest.fn().mockResolvedValue({ id: 'o1' }) },
        paymentAttempt: { findFirst: jest.fn().mockResolvedValue(null) },
        paymentCallbackReceipt: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        $transaction: jest.fn(),
      },
      true,
    );
    const result = await service.confirmPaymentCallback({
      orderId: 'o1',
      providerTxnId: 'txn-stale',
      callbackStatus: 'SUCCESS',
      signature: 'sig',
      rawPayload: JSON.stringify({
        nonce: 'n_stale',
        timestamp: Date.now() - 10 * 60 * 1000,
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('PAYMENT_CALLBACK_EXPIRED');
  });

  it('rejects provider transaction id conflict with different payload', async () => {
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          orderNo: 'ORD1',
          state: 'PENDING_PAYMENT',
          paymentState: 'PENDING',
          totalAmount: 1000,
        }),
      },
      paymentAttempt: { findFirst: jest.fn().mockResolvedValue(null) },
      paymentCallbackReceipt: {
        findFirst: jest.fn().mockResolvedValue({
          providerTxnId: 'txn_conflict',
          payloadHash: 'other_hash',
        }),
      },
      $transaction: jest.fn(),
    });
    const result = await service.confirmPaymentCallback({
      orderId: 'o1',
      providerTxnId: 'txn_conflict',
      callbackStatus: 'SUCCESS',
      signature: 'sig',
      rawPayload: JSON.stringify({
        nonce: 'n_conflict',
        timestamp: Date.now(),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('PAYMENT_CALLBACK_TXN_CONFLICT');
  });
});

describe('OrderService.couponAndCancel', () => {
  function buildService(mockPrisma: Record<string, unknown>) {
    const paymentProvider = {
      verifyTelebirrCallbackSignature: jest.fn().mockReturnValue(true),
    };
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const paymentMetrics = {
      markCallbackSuccess: jest.fn(),
      markCallbackFailed: jest.fn(),
      markReplayRejected: jest.fn(),
      markTxnConflict: jest.fn(),
    };
    return new OrderService(
      mockPrisma as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
  }

  it('applyCoupon returns preview amount', async () => {
    const service = buildService({
      coupon: {
        findFirst: jest.fn().mockResolvedValue({
          code: 'SAVE10',
          discountValue: 10,
        }),
      },
    });
    const result = await service.applyCoupon({
      shopId: 'shop_1',
      couponCode: 'SAVE10',
      subtotalAmount: 2000,
    });
    expect(result.ok).toBe(true);
    expect(result.preview?.discountAmount).toBe(200);
    expect(result.preview?.finalAmount).toBe(1800);
  });

  it('cancelOrder allows pending payment order', async () => {
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          orderNo: 'O1',
          state: 'PENDING_PAYMENT',
          paymentState: 'PENDING',
          totalAmount: 1000,
        }),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const tx = {
          order: {
            update: jest.fn().mockResolvedValue({
              id: 'o1',
              orderNo: 'O1',
              state: 'CANCELLED',
              paymentState: 'PENDING',
              totalAmount: 1000,
            }),
          },
          orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      }),
    });
    const result = await service.cancelOrder(
      { orderId: 'o1', reason: 'user_cancel' },
      'u1',
    );
    expect(result.ok).toBe(true);
    expect(result.order?.state).toBe('CANCELLED');
  });

  it('checkDelivery returns not deliverable when disabled', async () => {
    const service = buildService({
      shopDeliveryConfig: {
        findUnique: jest.fn().mockResolvedValue({
          deliveryEnabled: false,
          fixedFee: 0,
        }),
      },
    });
    const result = await service.checkDelivery('shop_1', {
      receiverName: 'A',
      phone: '123',
      detailAddress: 'X',
    });
    expect(result.deliverable).toBe(false);
    expect(result.reason).toContain('not enabled');
  });

  it('checkDelivery keeps local p95 under 200ms baseline', async () => {
    const service = buildService({
      shopDeliveryConfig: {
        findUnique: jest.fn().mockResolvedValue({
          deliveryEnabled: true,
          deliveryRadius: 5,
          fixedFee: 500,
        }),
      },
    });
    const samples: number[] = [];
    for (let i = 0; i < 120; i += 1) {
      const start = process.hrtime.bigint();
      await service.checkDelivery('shop_1', {
        receiverName: 'Bench',
        phone: '251900000000',
        detailAddress: 'Addis Ababa',
        latitude: 9.03,
        longitude: 38.74,
      });
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      samples.push(elapsedMs);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)];
    expect(p95).toBeLessThan(200);
  });
});

describe('OrderService.deliveryAcceptMode', () => {
  function buildService(mockPrisma: Record<string, unknown>) {
    const paymentProvider = {
      verifyTelebirrCallbackSignature: jest.fn().mockReturnValue(true),
    };
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const paymentMetrics = {
      markCallbackSuccess: jest.fn(),
      markCallbackFailed: jest.fn(),
      markReplayRejected: jest.fn(),
      markTxnConflict: jest.fn(),
    };
    const orderMock =
      typeof mockPrisma.order === 'object' && mockPrisma.order !== null
        ? (mockPrisma.order as Record<string, unknown>)
        : {};
    const prisma = {
      ...mockPrisma,
      order: {
        findFirst: jest.fn().mockResolvedValue(null),
        ...orderMock,
      },
    };
    return new OrderService(
      prisma as never,
      paymentProvider as never,
      eventProducer as never,
      paymentMetrics as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
  }

  const baseInput = {
    shopId: 'shop_1',
    idempotencyKey: 'idem_delivery_mode',
    paymentMethod: PaymentMethod.CASH,
    deliveryType: DeliveryType.DELIVERY,
    addressId: 'addr_1',
    items: [{ productId: 'p1', amount: 1 }],
  };

  function createOrderPrisma(deliveryAutoAccept: boolean) {
    return {
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({
          id: 'o_delivery',
          orderNo: 'ORD_1',
          state: 'PREPARING',
          paymentState: 'NOT_REQUIRED',
          totalAmount: 1500,
          deliveryType: DeliveryType.DELIVERY,
        }),
      },
      product: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'p1', name: 'dish', unitPrice: 1000, active: true },
          ]),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        const tx = {
          user: { upsert: jest.fn().mockResolvedValue({ id: 'u1' }) },
          coupon: {
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
            updateMany: jest.fn(),
          },
          shopDeliveryConfig: {
            findUnique: jest.fn().mockResolvedValue({
              deliveryEnabled: true,
              fixedFee: 500,
              deliveryAutoAccept,
            }),
          },
          userAddress: {
            findFirst: jest
              .fn()
              .mockResolvedValue({ id: 'addr_1', userId: 'u1' }),
          },
          order: {
            create: jest.fn().mockImplementation(async ({ data }: any) => ({
              id: 'o_delivery',
              orderNo: 'ORD_1',
              state: data.state,
              paymentState: data.paymentState,
              totalAmount: data.totalAmount,
              deliveryType: data.deliveryType,
            })),
          },
          couponUsageLog: { create: jest.fn() },
          orderStatusLog: { create: jest.fn() },
        };
        return cb(tx);
      }),
      orderStatusLog: { create: jest.fn() },
    };
  }

  it('creates delivery order as PREPARING when auto-accept is enabled', async () => {
    const service = buildService(createOrderPrisma(true));
    const result = await service.createOrder(baseInput, 'u1');
    expect(result.ok).toBe(true);
    expect(result.order?.state).toBe('PREPARING');
  });

  it('creates delivery order as PAID when manual-accept is enabled', async () => {
    const service = buildService(createOrderPrisma(false));
    const result = await service.createOrder(baseInput, 'u1');
    expect(result.ok).toBe(true);
    expect(result.order?.state).toBe('PAID');
  });

  it('acceptDeliveryOrder transitions PAID delivery order to PREPARING', async () => {
    const service = buildService({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          state: 'PAID',
          deliveryType: DeliveryType.DELIVERY,
          paymentState: 'SUCCESS',
          orderNo: 'ORD_1',
          totalAmount: 1500,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'o1',
          state: 'PREPARING',
          deliveryType: DeliveryType.DELIVERY,
          paymentState: 'SUCCESS',
          orderNo: 'ORD_1',
          totalAmount: 1500,
        }),
      },
      orderStatusLog: { create: jest.fn() },
    });
    const result = await service.acceptDeliveryOrder({ orderId: 'o1' });
    expect(result.ok).toBe(true);
    expect(result.order?.state).toBe('PREPARING');
  });

  it('markDeliveryOrderReady transitions PREPARING delivery order to READY', async () => {
    const paymentProvider = {
      verifyTelebirrCallbackSignature: jest.fn().mockReturnValue(true),
    };
    const eventProducer = { publish: jest.fn().mockResolvedValue(undefined) };
    const service = new OrderService(
      {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'o2',
            state: 'PREPARING',
            deliveryType: DeliveryType.DELIVERY,
            paymentState: 'SUCCESS',
            orderNo: 'ORD_2',
            totalAmount: 1500,
          }),
          update: jest.fn().mockResolvedValue({
            id: 'o2',
            state: 'READY',
            deliveryType: DeliveryType.DELIVERY,
            paymentState: 'SUCCESS',
            orderNo: 'ORD_2',
            totalAmount: 1500,
          }),
        },
        orderStatusLog: { create: jest.fn() },
      } as never,
      paymentProvider as never,
      eventProducer as never,
      {
        markCallbackSuccess: jest.fn(),
        markCallbackFailed: jest.fn(),
        markReplayRejected: jest.fn(),
        markTxnConflict: jest.fn(),
      } as never,
      inventoryStub() as never,
      tableServiceStub(),
      telebirrStub(),
      pubSubStub(),
    );
    const result = await service.markDeliveryOrderReady({ orderId: 'o2' });
    expect(result.ok).toBe(true);
    expect(result.order?.state).toBe('READY');
    expect(eventProducer.publish).toHaveBeenCalledWith('order.status.updated', {
      orderId: 'o2',
      fromState: 'PREPARING',
      toState: 'READY',
      deliveryType: DeliveryType.DELIVERY,
    });
  });

  it('deliveryOrders applies delivery and state filters with pagination', async () => {
    const service = buildService({
      order: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    });
    await service.deliveryOrders('shop_1', {
      state: 'PAID',
      page: 2,
      pageSize: 5,
    });
    expect((service as any).prisma.order.findMany).toHaveBeenCalledWith({
      where: {
        shopId: 'shop_1',
        deliveryType: DeliveryType.DELIVERY,
        state: 'PAID',
      },
      orderBy: { createdAt: 'desc' },
      skip: 5,
      take: 5,
    });
  });
});
