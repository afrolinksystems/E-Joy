import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PRISMA_CLIENT } from '../src/prisma/prisma.token';
import { createHmac } from 'node:crypto';

jest.mock('../src/prisma/prisma.service', () => {
  class PrismaService {}
  return { PrismaService };
});

import { AppModule } from './../src/app.module';

function signJwt(
  userId: string,
  secret: string,
  role: 'customer' | 'staff' | 'admin' = 'customer',
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const scope =
    role === 'customer'
      ? ['ticket:write']
      : role === 'staff'
        ? ['ticket:read', 'ticket:write', 'printer:write', 'delivery:write']
        : [
            'platform:read',
            'platform:write',
            'staff:read',
            'staff:write',
            'printer:read',
            'printer:write',
            'ticket:read',
            'ticket:write',
            'delivery:write',
          ];
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, role, scope, shopId: 'shop_1' }),
  ).toString('base64url');
  const sig = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const jwtSecret = 'e2e_jwt_secret';

  const state: {
    order: any;
    paymentAttempt: any;
    latestRawRequest: string;
    serviceTickets: any[];
  } = {
    order: null,
    paymentAttempt: null,
    latestRawRequest: '',
    serviceTickets: [],
  };

  const tx = {
    user: { upsert: jest.fn().mockResolvedValue({ id: 'user_1' }) },
    coupon: {
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
    couponUsageLog: { create: jest.fn().mockResolvedValue({}) },
    order: {
      create: jest.fn().mockImplementation(async ({ data }: any) => {
        state.order = {
          id: 'order_1',
          orderNo: data.orderNo,
          state: data.state,
          paymentState: data.paymentState,
          deliveryType: data.deliveryType,
          totalAmount: data.totalAmount,
          requestHash: data.requestHash,
          shopId: data.shopId,
          idempotencyKey: data.idempotencyKey,
          paidAt: null,
          providerTxnId: null,
        };
        return state.order;
      }),
      update: jest.fn().mockImplementation(async ({ data }: any) => {
        state.order = { ...state.order, ...data };
        return state.order;
      }),
    },
    orderStatusLog: { create: jest.fn().mockResolvedValue({}) },
    paymentAttempt: {
      create: jest.fn().mockImplementation(async ({ data }: any) => {
        state.latestRawRequest = data.rawRequest ?? state.latestRawRequest;
        state.paymentAttempt = {
          id: 'pa_1',
          orderId: data.orderId,
          channel: data.channel,
          state: data.state,
          providerTxnId: null,
        };
        return state.paymentAttempt;
      }),
      update: jest.fn().mockImplementation(async ({ data }: any) => {
        state.paymentAttempt = { ...state.paymentAttempt, ...data };
        return state.paymentAttempt;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        if (
          state.paymentAttempt &&
          state.paymentAttempt.orderId === where.orderId &&
          state.paymentAttempt.providerTxnId === where.providerTxnId
        ) {
          return state.paymentAttempt;
        }
        return null;
      }),
    },
    paymentCallbackReceipt: {
      create: jest.fn().mockResolvedValue({ id: 'cb_1' }),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    serviceTicket: {
      create: jest.fn().mockImplementation(async ({ data }: any) => {
        const row = {
          id: `ticket_${state.serviceTickets.length + 1}`,
          ...data,
          assignedStaffUserId: null,
          acceptedAt: null,
          resolvedAt: null,
          createdAt: new Date(),
        };
        state.serviceTickets.unshift(row);
        return row;
      }),
      findMany: jest.fn().mockImplementation(async ({ where }: any = {}) => {
        if (!where?.shopId) return state.serviceTickets;
        return state.serviceTickets.filter((t) => t.shopId === where.shopId);
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
        return state.serviceTickets.find((t) => t.id === where.id) ?? null;
      }),
      updateMany: jest.fn().mockImplementation(async ({ where, data }: any) => {
        const idx = state.serviceTickets.findIndex(
          (t) => t.id === where.id && t.status === where.status,
        );
        if (idx < 0) return { count: 0 };
        state.serviceTickets[idx] = { ...state.serviceTickets[idx], ...data };
        return { count: 1 };
      }),
      count: jest.fn().mockImplementation(async ({ where }: any = {}) => {
        return state.serviceTickets.filter((t) => {
          if (where?.shopId && t.shopId !== where.shopId) return false;
          if (where?.status && t.status !== where.status) return false;
          return true;
        }).length;
      }),
    },
    staffNotification: {
      create: jest.fn().mockResolvedValue({
        id: 'notif_1',
        shopId: 'shop_1',
        recipientUserId: 'staff_broadcast',
        type: 'CALL',
        title: 'new call',
        content: 'Need assistance',
        createdAt: new Date(),
        readAt: null,
      }),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    userAddress: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'addr_1',
        userId: 'user_1',
        receiverName: 'A',
        phone: '123',
        detailAddress: 'Bole road',
        isDefault: true,
      }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    shopDeliveryConfig: {
      findUnique: jest.fn().mockResolvedValue({
        shopId: 'shop_1',
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        deliveryFeeType: 'FIXED',
        fixedFee: 300,
        freeDeliveryThreshold: null,
        deliveryAutoAccept: false,
      }),
      upsert: jest.fn(),
    },
  };

  const prismaMock = {
    order: {
      findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where.id) {
          return state.order && state.order.id === where.id
            ? state.order
            : null;
        }
        if (where.shopId_idempotencyKey && state.order) {
          const scoped = where.shopId_idempotencyKey;
          if (
            state.order.shopId === scoped.shopId &&
            state.order.idempotencyKey === scoped.idempotencyKey
          ) {
            return state.order;
          }
        }
        return null;
      }),
      update: tx.order.update,
    },
    diningTable: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: 'table_1', shopId: 'shop_1' }),
    },
    product: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { id: 'p1', name: 'Burger', unitPrice: 1200, active: true },
        ]),
    },
    coupon: { findFirst: jest.fn().mockResolvedValue(null) },
    userAddress: {
      findMany: tx.userAddress.findMany,
      findFirst: tx.userAddress.findFirst,
      create: tx.userAddress.create,
      updateMany: tx.userAddress.updateMany,
      deleteMany: tx.userAddress.deleteMany,
    },
    shopDeliveryConfig: {
      findUnique: tx.shopDeliveryConfig.findUnique,
      upsert: tx.shopDeliveryConfig.upsert,
    },
    paymentAttempt: {
      findFirst: tx.paymentAttempt.findFirst,
    },
    orderStatusLog: { create: tx.orderStatusLog.create },
    paymentCallbackReceipt: { findFirst: tx.paymentCallbackReceipt.findFirst },
    serviceTicket: {
      create: tx.serviceTicket.create,
      findMany: tx.serviceTicket.findMany,
      findUnique: tx.serviceTicket.findUnique,
      updateMany: tx.serviceTicket.updateMany,
      count: tx.serviceTicket.count,
    },
    staffNotification: {
      create: tx.staffNotification.create,
      findMany: tx.staffNotification.findMany,
      updateMany: tx.staffNotification.updateMany,
    },
    $transaction: jest.fn().mockImplementation(async (cb: any) => cb(tx)),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = jwtSecret;
    process.env.TELEBIRR_APP_SECRET = jwtSecret;
    state.order = null;
    state.paymentAttempt = null;
    state.latestRawRequest = '';
    state.serviceTickets = [];

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRISMA_CLIENT)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('order flow smoke: create -> initiate -> callback', async () => {
    const token = signJwt('user_1', jwtSecret);
    const createOrderMutation = `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          ok
          error { code message }
          order { id orderNo state paymentState totalAmount }
        }
      }
    `;
    const createRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${token}`)
      .send({
        query: createOrderMutation,
        variables: {
          input: {
            shopId: 'shop_1',
            tableId: 'table_1',
            idempotencyKey: 'idem_e2e',
            paymentMethod: 'TELEBIRR',
            items: [{ productId: 'p1', amount: 1 }],
          },
        },
      })
      .expect(200);
    expect(createRes.body.data.createOrder.ok).toBe(true);
    const orderId = createRes.body.data.createOrder.order.id;

    const initiateMutation = `
      mutation InitiatePayment($input: InitiatePaymentInput!) {
        initiatePayment(input: $input) {
          ok
          error { code message }
          rawRequest
          payment { id channel state }
        }
      }
    `;
    const initiateRes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: initiateMutation,
        variables: { input: { orderId, channel: 'TELEBIRR_APP' } },
      })
      .expect(200);
    expect(initiateRes.body.data.initiatePayment.ok).toBe(true);

    const rawPayload = JSON.stringify({
      orderId,
      status: 'SUCCESS',
      nonce: 'e2e_nonce_1',
      timestamp: Date.now(),
    });
    const signature = createHmac('sha256', jwtSecret)
      .update(rawPayload)
      .digest('hex');
    const callbackMutation = `
      mutation ConfirmPayment($input: ConfirmPaymentCallbackInput!) {
        confirmPaymentCallback(input: $input) {
          ok
          error { code message }
          order { id state paymentState }
        }
      }
    `;
    const callbackRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('x-request-id', 'req_e2e_001')
      .set('x-forwarded-for', '203.0.113.10')
      .send({
        query: callbackMutation,
        variables: {
          input: {
            orderId,
            providerTxnId: 'txn_1',
            callbackStatus: 'SUCCESS',
            signature,
            rawPayload,
          },
        },
      })
      .expect(200);
    expect(callbackRes.body.data.confirmPaymentCallback.ok).toBe(true);
    expect(callbackRes.body.data.confirmPaymentCallback.order.state).toBe(
      'PAID',
    );
    expect(
      callbackRes.body.data.confirmPaymentCallback.order.paymentState,
    ).toBe('SUCCESS');
    expect(tx.paymentCallbackReceipt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'req_e2e_001',
          sourceIp: '203.0.113.10',
        }),
      }),
    );
  });

  it('rejects callback when same providerTxnId has different payload hash', async () => {
    const token = signJwt('user_1', jwtSecret);
    const createOrderMutation = `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          ok
          order { id }
        }
      }
    `;
    const createRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${token}`)
      .send({
        query: createOrderMutation,
        variables: {
          input: {
            shopId: 'shop_1',
            tableId: 'table_1',
            idempotencyKey: 'idem_e2e_conflict',
            paymentMethod: 'TELEBIRR',
            items: [{ productId: 'p1', amount: 1 }],
          },
        },
      })
      .expect(200);
    const orderId = createRes.body.data.createOrder.order.id;

    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation InitiatePayment($input: InitiatePaymentInput!) {
            initiatePayment(input: $input) { ok }
          }
        `,
        variables: { input: { orderId, channel: 'TELEBIRR_APP' } },
      })
      .expect(200);

    const rawPayload = JSON.stringify({
      orderId,
      status: 'SUCCESS',
      nonce: 'conflict_n1',
      timestamp: Date.now(),
    });
    const signature = createHmac('sha256', jwtSecret)
      .update(rawPayload)
      .digest('hex');

    // Simulate an existing callback receipt with same txn id but different payload hash.
    tx.paymentCallbackReceipt.findFirst.mockResolvedValueOnce({
      providerTxnId: 'txn_conflict_e2e',
      payloadHash: 'another_payload_hash',
    });

    const callbackRes = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation ConfirmPayment($input: ConfirmPaymentCallbackInput!) {
            confirmPaymentCallback(input: $input) {
              ok
              error { code message }
            }
          }
        `,
        variables: {
          input: {
            orderId,
            providerTxnId: 'txn_conflict_e2e',
            callbackStatus: 'SUCCESS',
            signature,
            rawPayload,
          },
        },
      })
      .expect(200);

    expect(callbackRes.body.data.confirmPaymentCallback.ok).toBe(false);
    expect(callbackRes.body.data.confirmPaymentCallback.error.code).toBe(
      'PAYMENT_CALLBACK_TXN_CONFLICT',
    );
  });

  it('handles out-of-order callbacks matrix', async () => {
    const token = signJwt('user_1', jwtSecret);
    const create = async (idem: string) => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('authorization', `Bearer ${token}`)
        .send({
          query: `
            mutation CreateOrder($input: CreateOrderInput!) {
              createOrder(input: $input) {
                ok
                order { id }
              }
            }
          `,
          variables: {
            input: {
              shopId: 'shop_1',
              tableId: 'table_1',
              idempotencyKey: idem,
              paymentMethod: 'TELEBIRR',
              items: [{ productId: 'p1', amount: 1 }],
            },
          },
        })
        .expect(200);
      return res.body.data.createOrder.order.id as string;
    };

    const callback = async (
      orderId: string,
      providerTxnId: string,
      callbackStatus: 'SUCCESS' | 'FAILED',
      nonce: string,
    ) => {
      const rawPayload = JSON.stringify({
        orderId,
        status: callbackStatus,
        nonce,
        timestamp: Date.now(),
      });
      const signature = createHmac('sha256', jwtSecret)
        .update(rawPayload)
        .digest('hex');
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation ConfirmPayment($input: ConfirmPaymentCallbackInput!) {
              confirmPaymentCallback(input: $input) {
                ok
                order { state paymentState }
              }
            }
          `,
          variables: {
            input: {
              orderId,
              providerTxnId,
              callbackStatus,
              signature,
              rawPayload,
            },
          },
        })
        .expect(200);
    };

    const orderA = await create('idem_out_of_order_a');
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation InitiatePayment($input: InitiatePaymentInput!) {
            initiatePayment(input: $input) { ok }
          }
        `,
        variables: { input: { orderId: orderA, channel: 'TELEBIRR_APP' } },
      })
      .expect(200);
    await callback(orderA, 'txn_out_order_a_1', 'SUCCESS', 'nonce_a_1');
    const lateFailed = await callback(
      orderA,
      'txn_out_order_a_2',
      'FAILED',
      'nonce_a_2',
    );
    expect(lateFailed.body.data.confirmPaymentCallback.order.state).toBe(
      'PAID',
    );
    expect(lateFailed.body.data.confirmPaymentCallback.order.paymentState).toBe(
      'SUCCESS',
    );

    const orderB = await create('idem_out_of_order_b');
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation InitiatePayment($input: InitiatePaymentInput!) {
            initiatePayment(input: $input) { ok }
          }
        `,
        variables: { input: { orderId: orderB, channel: 'TELEBIRR_APP' } },
      })
      .expect(200);
    await callback(orderB, 'txn_out_order_b_1', 'FAILED', 'nonce_b_1');
    const followSuccess = await callback(
      orderB,
      'txn_out_order_b_2',
      'SUCCESS',
      'nonce_b_2',
    );
    expect(followSuccess.body.data.confirmPaymentCallback.ok).toBe(false);
    expect(followSuccess.body.data.confirmPaymentCallback.ok).toBe(false);
  });

  it('enforces role permissions and staff ticket transitions', async () => {
    const customerToken = signJwt('customer_1', jwtSecret, 'customer');
    const staffToken = signJwt('staff_1', jwtSecret, 'staff');
    const adminToken = signJwt('admin_1', jwtSecret, 'admin');

    const callRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${customerToken}`)
      .send({
        query: `
          mutation CallWaiter($input: CallWaiterInput!) {
            callWaiter(input: $input) { id status }
          }
        `,
        variables: {
          input: { shopId: 'shop_1', tableId: 'table_1', reason: 'Help' },
        },
      })
      .expect(200);
    const ticketId = callRes.body.data.callWaiter.id;
    expect(callRes.body.data.callWaiter.status).toBe('OPEN');

    const forbiddenByCustomer = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${customerToken}`)
      .send({
        query: `
          mutation Accept($input: AcceptServiceTicketInput!) {
            acceptServiceTicket(input: $input) { id status }
          }
        `,
        variables: { input: { ticketId } },
      })
      .expect(200);
    expect(forbiddenByCustomer.body.errors?.[0]?.message).toContain(
      'Insufficient role permissions',
    );

    const accepted = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${staffToken}`)
      .send({
        query: `
          mutation Accept($input: AcceptServiceTicketInput!) {
            acceptServiceTicket(input: $input) { id status assignedStaffUserId }
          }
        `,
        variables: { input: { ticketId } },
      })
      .expect(200);
    expect(accepted.body.data.acceptServiceTicket.status).toBe('ACCEPTED');

    const callRes2 = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${customerToken}`)
      .send({
        query: `
          mutation CallWaiter($input: CallWaiterInput!) {
            callWaiter(input: $input) { id status }
          }
        `,
        variables: {
          input: { shopId: 'shop_1', tableId: 'table_1', reason: 'Need bill' },
        },
      })
      .expect(200);
    const ticketId2 = callRes2.body.data.callWaiter.id;

    const [c1, c2] = await Promise.all([
      request(app.getHttpServer())
        .post('/graphql')
        .set('authorization', `Bearer ${staffToken}`)
        .send({
          query: `
            mutation Accept($input: AcceptServiceTicketInput!) {
              acceptServiceTicket(input: $input) { id status }
            }
          `,
          variables: { input: { ticketId: ticketId2 } },
        }),
      request(app.getHttpServer())
        .post('/graphql')
        .set('authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            mutation Accept($input: AcceptServiceTicketInput!) {
              acceptServiceTicket(input: $input) { id status }
            }
          `,
          variables: { input: { ticketId: ticketId2 } },
        }),
    ]);
    const concurrentSuccessCount = [c1, c2].filter(
      (r) => r.body.data.acceptServiceTicket,
    ).length;
    expect(concurrentSuccessCount).toBe(1);
  });

  it('supports coupon preview and cancel order flow', async () => {
    const token = signJwt('user_1', jwtSecret, 'customer');

    prismaMock.coupon.findFirst.mockResolvedValueOnce({
      id: 'coupon_1',
      code: 'SAVE10',
      discountValue: 10,
      active: true,
      validFrom: new Date(Date.now() - 1000),
      validUntil: new Date(Date.now() + 1000 * 60 * 60),
    });

    const couponRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${token}`)
      .send({
        query: `
          mutation ApplyCoupon($input: ApplyCouponInput!) {
            applyCoupon(input: $input) {
              ok
              preview { couponCode discountAmount finalAmount }
            }
          }
        `,
        variables: {
          input: {
            shopId: 'shop_1',
            couponCode: 'SAVE10',
            subtotalAmount: 1000,
          },
        },
      })
      .expect(200);
    expect(couponRes.body.data.applyCoupon.ok).toBe(true);
    expect(couponRes.body.data.applyCoupon.preview.finalAmount).toBe(900);

    const createRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${token}`)
      .send({
        query: `
          mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
              ok
              order { id state }
            }
          }
        `,
        variables: {
          input: {
            shopId: 'shop_1',
            tableId: 'table_1',
            idempotencyKey: 'idem_cancel_flow',
            paymentMethod: 'TELEBIRR',
            items: [{ productId: 'p1', amount: 1 }],
          },
        },
      })
      .expect(200);
    const orderId = createRes.body.data.createOrder.order.id;

    const cancelRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${token}`)
      .send({
        query: `
          mutation CancelOrder($input: CancelOrderInput!) {
            cancelOrder(input: $input) {
              ok
              order { id state }
            }
          }
        `,
        variables: { input: { orderId, reason: 'changed mind' } },
      })
      .expect(200);
    expect(cancelRes.body.data.cancelOrder.ok).toBe(true);
    expect(cancelRes.body.data.cancelOrder.order.state).toBe('CANCELLED');
  });

  it('covers delivery and pickup flow baseline', async () => {
    const token = signJwt('user_1', jwtSecret, 'customer');

    const deliveryCreateRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${token}`)
      .send({
        query: `
          mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
              ok
              order { id state deliveryType paymentState }
            }
          }
        `,
        variables: {
          input: {
            shopId: 'shop_1',
            idempotencyKey: 'idem_delivery_flow',
            paymentMethod: 'CASH',
            deliveryType: 'DELIVERY',
            addressId: 'addr_1',
            items: [{ productId: 'p1', amount: 1 }],
          },
        },
      })
      .expect(200);
    expect(deliveryCreateRes.body.data.createOrder.ok).toBe(true);
    expect(deliveryCreateRes.body.data.createOrder.order.state).toBe('PAID');

    const deliveryOrderId = deliveryCreateRes.body.data.createOrder.order.id;
    const acceptRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${signJwt('admin_1', jwtSecret, 'admin')}`)
      .send({
        query: `
          mutation AcceptDeliveryOrder($input: AcceptDeliveryOrderInput!) {
            acceptDeliveryOrder(input: $input) {
              ok
              order { id state }
            }
          }
        `,
        variables: { input: { orderId: deliveryOrderId } },
      })
      .expect(200);
    expect(acceptRes.body.data.acceptDeliveryOrder.ok).toBe(true);
    expect(acceptRes.body.data.acceptDeliveryOrder.order.state).toBe(
      'PREPARING',
    );

    const pickupCreateRes = await request(app.getHttpServer())
      .post('/graphql')
      .set('authorization', `Bearer ${token}`)
      .send({
        query: `
          mutation CreateOrder($input: CreateOrderInput!) {
            createOrder(input: $input) {
              ok
              order { id state deliveryType }
            }
          }
        `,
        variables: {
          input: {
            shopId: 'shop_1',
            idempotencyKey: 'idem_pickup_flow',
            paymentMethod: 'CASH',
            deliveryType: 'PICKUP',
            items: [{ productId: 'p1', amount: 1 }],
          },
        },
      })
      .expect(200);
    expect(pickupCreateRes.body.data.createOrder.ok).toBe(true);
    expect(pickupCreateRes.body.data.createOrder.order.deliveryType).toBe(
      'PICKUP',
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
