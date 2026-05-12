import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import type { Prisma, Product } from '@prisma/client';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TableService } from '../table/table.service';
import { InventoryService } from './inventory.service';
import { PAYMENT_PROVIDER } from '../payment/payment-provider.interface';
import type { PaymentProvider } from '../payment/payment-provider.interface';
import { PAYMENT_EVENT_PRODUCER } from '../payment/payment-event-producer.interface';
import type { PaymentEventProducer } from '../payment/payment-event-producer.interface';
import { PaymentMetricsService } from '../payment/payment-metrics.service';
import { TelebirrService } from '../payment/telebirr.service';
import {
  DeliveryAcceptMode,
  DeliveryFeeType,
  DeliveryType,
  MerchantDispatchOrderModel,
  MerchantOrderStatus,
  OrderDetailModel,
  OrderHistoryOrderModel,
  OrderModel,
  OrderPayload,
  OrderState,
  PaymentChannel,
  PaymentPayload,
  PaymentState,
  ShopMenuProductModel,
} from './order.types';
import {
  ApplyCouponInput,
  AcceptDeliveryOrderInput,
  AddressInput,
  CancelOrderInput,
  ConfirmPaymentCallbackInput,
  CreateAddressInput,
  CreateOrderInput,
  DeliveryOrderFilterInput,
  DeliveryConfigInput,
  InitiatePaymentInput,
  MarkDeliveryOrderReadyInput,
  UpdateAddressInput,
} from './order.inputs';

class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type CallbackPayload = {
  nonce: string;
  timestamp: number;
  requestId?: string;
  sourceIp?: string;
};

type CallbackRequestMeta = {
  requestId?: string;
  sourceIp?: string;
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProviderService: PaymentProvider,
    @Inject(PAYMENT_EVENT_PRODUCER)
    private readonly paymentEventProducer: PaymentEventProducer,
    private readonly paymentMetricsService: PaymentMetricsService,
    private readonly inventoryService: InventoryService,
    private readonly tableService: TableService,
    private readonly telebirrService: TelebirrService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  /**
   * REST entrypoint for Telebirr notify URL; delegates to confirmPaymentCallback with HMAC-compatible payload.
   */
  async handleTelebirrWebhook(body: unknown): Promise<void> {
    const notify = this.telebirrService.parseNotifyPayload(body);
    const st = notify.tradeStatus.toUpperCase();
    const success = st === 'SUCCESS' || st === 'TRADE_SUCCESS' || st === 'COMPLETED';
    const rawPayload = JSON.stringify({
      nonce: randomUUID(),
      timestamp: Date.now(),
      requestId: 'telebirr-rest-webhook',
      telebirr: notify,
    });
    const secret = process.env.TELEBIRR_APP_SECRET ?? process.env.JWT_SECRET ?? '';
    if (!secret) {
      throw new Error('JWT_SECRET or TELEBIRR_APP_SECRET is required for webhook processing');
    }
    const signature = createHmac('sha256', secret).update(rawPayload).digest('hex');
    const result = await this.confirmPaymentCallback({
      orderId: notify.outTradeNo,
      providerTxnId: notify.tradeNo,
      callbackStatus: success ? 'SUCCESS' : 'FAILED',
      signature,
      rawPayload,
    });
    if (!result.ok) {
      throw new Error(result.error?.message ?? 'Payment callback failed');
    }
  }

  /**
   * Sandbox: mark order paid and notify subscribers (no real Telebirr crypto).
   * Disabled when `MOCK_PAYMENT_ENABLED=false`.
   */
  async applyMockPaymentSuccess(
    orderId: string,
  ): Promise<{ ok: boolean; error?: string }> {
    if (process.env.MOCK_PAYMENT_ENABLED === 'false') {
      return { ok: false, error: 'Mock payment is disabled' };
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { ok: false, error: 'Order not found' };
    }
    if (order.state !== OrderState.PENDING_PAYMENT) {
      if (
        order.paymentState === PaymentState.SUCCESS ||
        order.state === OrderState.PAID ||
        order.state === OrderState.PREPARING
      ) {
        return { ok: true };
      }
      return { ok: false, error: 'Order is not awaiting payment' };
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      let deliveryAutoAccept = false;
      if (order.deliveryType === DeliveryType.DELIVERY) {
        const cfg = await tx.shopDeliveryConfig.findUnique({
          where: { shopId: order.shopId },
        });
        deliveryAutoAccept = Boolean(
          (cfg as { deliveryAutoAccept?: boolean } | null)?.deliveryAutoAccept,
        );
      }
      const targetState = deliveryAutoAccept
        ? OrderState.PREPARING
        : OrderState.PAID;
      const targetPaymentState = PaymentState.SUCCESS;

      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          state: targetState,
          status: this.merchantStatusFromOrderState(targetState),
          paymentState: targetPaymentState,
          providerTxnId: `mock_${Date.now()}`,
          paidAt: new Date(),
        },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromState: order.state,
          toState: next.state,
          operatorType: 'SYSTEM',
          reason: 'mock_telebirr_payment',
          metadata: { source: 'mock-callback' },
        },
      });
      return next;
    });

    if (updatedOrder.tableId) {
      void this.emitTableStatusChanged(updatedOrder.shopId, updatedOrder.tableId);
    }
    return { ok: true };
  }

  /**
   * 下单计价唯一来源：数据库 Product.unitPrice（整数，单位：分）。
   * GraphQL 入参不得、且当前也不包含任何客户端单价/总价字段。
   */
  async createOrder(
    input: CreateOrderInput,
    userId?: string,
  ): Promise<OrderPayload> {
    if (!input.items.length || input.items.some((item) => item.amount <= 0)) {
      return {
        ok: false,
        error: {
          code: 'ORDER_VALIDATION_FAILED',
          message: 'Order must contain valid items',
        },
      };
    }

    const { tableRef, deliveryType } =
      this.resolveCreateOrderDeliveryTypeAndTableRef(input);

    const requestHash = this.buildRequestHash(input);
    const existing = await this.prisma.order.findUnique({
      where: {
        shopId_idempotencyKey: {
          shopId: input.shopId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return {
          ok: false,
          error: {
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'Idempotency key has conflicting payload',
          },
        };
      }
      return { ok: true, order: this.toOrderModel(existing) };
    }

    let resolvedTableId: string | undefined;
    if (deliveryType === DeliveryType.DINE_IN) {
      if (!tableRef) {
        return {
          ok: false,
          error: {
            code: 'ORDER_VALIDATION_FAILED',
            message: 'Table is required for dine-in order',
          },
        };
      }
      resolvedTableId = await this.resolveDineInTableId(
        input.shopId,
        tableRef,
      );
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        shopId: input.shopId,
        active: true,
        status: 'ACTIVE',
      } as Record<string, unknown>,
    });
    if (products.length !== productIds.length) {
      return {
        ok: false,
        error: {
          code: 'ORDER_VALIDATION_FAILED',
          message: 'Some products are unavailable',
        },
      };
    }

    const productsById = new Map<string, Product>(
      products.map((product) => [product.id, product]),
    );
    const { itemRows, subtotalAmount } = this.buildServerAuthoritativeLineItems(
      input.items,
      productsById,
    );
    const actorUserId = userId ?? 'user_placeholder';
    const paymentState =
      input.paymentMethod === 'CASH'
        ? PaymentState.NOT_REQUIRED
        : PaymentState.PENDING;
    const orderNo = `O${Date.now()}${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`;

    const appendTarget =
      deliveryType === DeliveryType.DINE_IN && resolvedTableId
        ? await this.prisma.order.findFirst({
            where: {
              shopId: input.shopId,
              tableId: resolvedTableId,
              userId: actorUserId,
              status: {
                in: [PrismaOrderStatus.PENDING, PrismaOrderStatus.PREPARING],
              },
              state: OrderState.PENDING_PAYMENT,
              deliveryType: DeliveryType.DINE_IN,
              paymentMethod: input.paymentMethod,
            },
            orderBy: { createdAt: 'desc' },
          })
        : null;

    if (appendTarget) {
      if (input.couponCode?.trim()) {
        return {
          ok: false,
          error: {
            code: 'ORDER_APPEND_COUPON_NOT_ALLOWED',
            message:
              'Cannot apply a coupon when adding items to an existing open order',
          },
        };
      }
      try {
        for (const item of input.items) {
          await this.inventoryService.atomicDeduct(item.productId, item.amount);
        }
      } catch (err) {
        if (err instanceof ConflictException) {
          return {
            ok: false,
            error: {
              code: 'INVENTORY_INSUFFICIENT',
              message: err.message,
            },
          };
        }
        throw err;
      }
      try {
        const appended = await this.appendItemsToExistingOrder({
          activeOrderId: appendTarget.id,
          shopId: input.shopId,
          tableId: resolvedTableId!,
          actorUserId,
          itemRows,
          addedSubtotal: subtotalAmount,
        });
        return { ok: true, order: this.toOrderModel(appended) };
      } catch (error) {
        if (error instanceof DomainError) {
          return {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
            },
          };
        }
        if (this.isUniqueConstraintError(error)) {
          const replay = await this.prisma.order.findUnique({
            where: {
              shopId_idempotencyKey: {
                shopId: input.shopId,
                idempotencyKey: input.idempotencyKey,
              },
            },
          });
          if (replay) {
            return { ok: true, order: this.toOrderModel(replay) };
          }
          return {
            ok: false,
            error: {
              code: 'ORDER_CREATE_FAILED',
              message: 'Duplicate request could not be reconciled',
            },
          };
        }
        throw error;
      }
    }

    try {
      for (const item of input.items) {
        await this.inventoryService.atomicDeduct(item.productId, item.amount);
      }
    } catch (err) {
      if (err instanceof ConflictException) {
        return {
          ok: false,
          error: {
            code: 'INVENTORY_INSUFFICIENT',
            message: err.message,
          },
        };
      }
      throw err;
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        await tx.user.upsert({
          where: { id: actorUserId },
          update: {},
          create: { id: actorUserId, phone: `stub-${actorUserId}` },
        });

        const now = new Date();
        let couponId: string | undefined;
        let discountAmount = 0;
        if (input.couponCode) {
          const coupon = await tx.coupon.findFirst({
            where: {
              shopId: input.shopId,
              code: input.couponCode,
              active: true,
              validFrom: { lte: now },
              validUntil: { gte: now },
            },
          });
          if (!coupon) {
            throw new DomainError('COUPON_INVALID', 'Coupon is invalid');
          }

          if (coupon.usageLimit > 0) {
            const updated = await tx.coupon.updateMany({
              where: {
                id: coupon.id,
                usedCount: { lt: coupon.usageLimit },
              },
              data: {
                usedCount: { increment: 1 },
              },
            });
            if (updated.count === 0) {
              throw new DomainError(
                'COUPON_LIMIT_EXCEEDED',
                'Coupon usage limit exceeded',
              );
            }
          } else {
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
          }

          discountAmount = Math.floor(
            (subtotalAmount * coupon.discountValue) / 100,
          );
          couponId = coupon.id;
        }

        let deliveryFee = 0;
        let deliveryAutoAccept = false;
        if (deliveryType === DeliveryType.DELIVERY) {
          if (!input.addressId) {
            throw new DomainError(
              'ORDER_VALIDATION_FAILED',
              'Address is required for delivery order',
            );
          }
          const cfg = await tx.shopDeliveryConfig.findUnique({
            where: { shopId: input.shopId },
          });
          if (!cfg?.deliveryEnabled) {
            throw new DomainError(
              'DELIVERY_NOT_AVAILABLE',
              'Delivery is not enabled for this shop',
            );
          }
          deliveryAutoAccept = Boolean(
            (cfg as { deliveryAutoAccept?: boolean }).deliveryAutoAccept,
          );
          const address = await tx.userAddress.findFirst({
            where: { id: input.addressId, userId: actorUserId },
          });
          if (!address) {
            throw new DomainError(
              'ORDER_VALIDATION_FAILED',
              'Address does not belong to current user',
            );
          }
          deliveryFee = cfg.fixedFee ?? 0;
        }

        if (deliveryType !== DeliveryType.DELIVERY) {
          deliveryFee = 0;
        }

        const totalAmount = Math.max(
          0,
          subtotalAmount - discountAmount + deliveryFee,
        );
        const initialOrderState =
          deliveryType === DeliveryType.DELIVERY &&
          paymentState === PaymentState.NOT_REQUIRED
            ? deliveryAutoAccept
              ? OrderState.PREPARING
              : OrderState.PAID
            : OrderState.PENDING_PAYMENT;

        const order = await tx.order.create({
          data: {
            orderNo,
            idempotencyKey: input.idempotencyKey,
            requestHash,
            userId: actorUserId,
            shopId: input.shopId,
            tableId: resolvedTableId,
            deliveryType,
            addressId: input.addressId,
            deliveryFee,
            pickupCode:
              deliveryType === DeliveryType.PICKUP
                ? this.buildPickupCode()
                : null,
            state: initialOrderState,
            status: this.initialMerchantStatus(initialOrderState),
            paymentMethod: input.paymentMethod,
            paymentState,
            subtotalAmount,
            discountAmount,
            totalAmount,
            note: input.note,
            couponId,
            pricingSnapshot: {
              subtotalAmount,
              discountAmount,
              deliveryFee,
              totalAmount,
              currency: 'ETB_CENT',
              paymentRouting: {
                shopId: input.shopId,
                paymentMethod: input.paymentMethod,
                provider: input.paymentMethod === 'TELEBIRR' ? 'TELEBIRR' : 'CASH',
                mode: 'SHOP_SCOPED_CONFIG_STUB',
              },
              items: itemRows,
            },
            items: {
              create: itemRows,
            },
            statusLogs: {
              create: {
                fromState: null,
                toState: initialOrderState,
                operatorType: 'CUSTOMER',
                operatorId: actorUserId,
                reason:
                  initialOrderState === OrderState.PREPARING
                    ? 'createOrder_auto_accept_delivery'
                    : 'createOrder',
                metadata: { requestId: randomUUID() },
              },
            },
          },
        });
        if (couponId && discountAmount > 0) {
          await tx.couponUsageLog.create({
            data: {
              couponId,
              orderId: order.id,
              userId: actorUserId,
              discountAmount,
            },
          });
        }
        return order;
      });
      if (resolvedTableId) {
        void this.emitTableStatusChanged(input.shopId, resolvedTableId);
      }
      return { ok: true, order: this.toOrderModel(created) };
    } catch (error) {
      if (error instanceof DomainError) {
        return {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }
      if (this.isUniqueConstraintError(error)) {
        const replay = await this.prisma.order.findUnique({
          where: {
            shopId_idempotencyKey: {
              shopId: input.shopId,
              idempotencyKey: input.idempotencyKey,
            },
          },
        });
        if (replay) {
          if (replay.requestHash !== requestHash) {
            return {
              ok: false,
              error: {
                code: 'IDEMPOTENCY_CONFLICT',
                message: 'Idempotency key has conflicting payload',
              },
            };
          }
          return { ok: true, order: this.toOrderModel(replay) };
        }
        return {
          ok: false,
          error: {
            code: 'ORDER_CREATE_FAILED',
            message: 'Duplicate request could not be reconciled',
          },
        };
      }
      throw error;
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<PaymentPayload> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });
    if (!order) {
      return {
        ok: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      };
    }
    if (order.state !== OrderState.PENDING_PAYMENT) {
      return {
        ok: false,
        error: {
          code: 'ORDER_STATE_INVALID_TRANSITION',
          message: 'Order state does not allow payment initiation',
        },
      };
    }

    let rawRequest = `PAYMENT_REQUEST_${input.channel}_${order.id}_${Date.now()}`;
    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paymentAttempt.create({
        data: {
          orderId: order.id,
          channel: input.channel,
          state: PaymentState.INITIATED,
          rawRequest,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentState: PaymentState.INITIATED,
        },
      });
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromState: order.state,
          toState: order.state,
          operatorType: 'SYSTEM',
          reason: 'initiatePayment',
          metadata: { paymentAttemptId: created.id },
        },
      });
      return created;
    });

    await this.paymentEventProducer.publish('payment.initiated', {
      orderId: order.id,
      paymentAttemptId: payment.id,
      channel: payment.channel,
    });

    if (input.channel === PaymentChannel.TELEBIRR_H5) {
      if (!this.telebirrService.isConfigured()) {
        return {
          ok: false,
          error: {
            code: 'TELEBIRR_NOT_CONFIGURED',
            message:
              'Telebirr is not configured (set TELEBIRR_API_BASE, TELEBIRR_APP_ID, TELEBIRR_APP_KEY, TELEBIRR_SHORT_CODE, TELEBIRR_PUBLIC_KEY, TELEBIRR_NOTIFY_URL)',
          },
        };
      }
      try {
        const { toPayUrl } = await this.telebirrService.createH5Order(
          order.id,
          order.totalAmount,
        );
        rawRequest = toPayUrl;
        await this.prisma.paymentAttempt.update({
          where: { id: payment.id },
          data: { rawRequest: toPayUrl },
        });
        return {
          ok: true,
          payment: {
            id: payment.id,
            channel: payment.channel as PaymentChannel,
            state: payment.state as PaymentState,
          },
          rawRequest: toPayUrl,
          toPayUrl,
        };
      } catch (e) {
        this.logger.error(
          `Telebirr H5 create order failed: ${e instanceof Error ? e.message : String(e)}`,
        );
        return {
          ok: false,
          error: {
            code: 'TELEBIRR_H5_FAILED',
            message:
              e instanceof Error ? e.message : 'Telebirr create order failed',
          },
        };
      }
    }

    return {
      ok: true,
      payment: {
        id: payment.id,
        channel: payment.channel as PaymentChannel,
        state: payment.state as PaymentState,
      },
      rawRequest,
    };
  }

  async confirmPaymentCallback(
    input: ConfirmPaymentCallbackInput,
    requestMeta?: CallbackRequestMeta,
  ): Promise<OrderPayload> {
    if (
      !this.paymentProviderService.verifyTelebirrCallbackSignature(
        input.rawPayload,
        input.signature,
      )
    ) {
      return {
        ok: false,
        error: {
          code: 'PAYMENT_SIGNATURE_INVALID',
          message: 'Invalid payment callback signature',
        },
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });
    if (!order) {
      return {
        ok: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      };
    }

    const callbackSuccess = input.callbackStatus.toUpperCase() === 'SUCCESS';
    const callbackState = callbackSuccess
      ? PaymentState.SUCCESS
      : PaymentState.FAILED;

    const existingAttempt = await this.prisma.paymentAttempt.findFirst({
      where: {
        orderId: input.orderId,
        providerTxnId: input.providerTxnId,
      },
    });
    if (existingAttempt?.state === PaymentState.SUCCESS && callbackSuccess) {
      return { ok: true, order: this.toOrderModel(order) };
    }

    try {
      const callbackPayload = this.parseAndValidateCallbackPayload(
        input.rawPayload,
      );
      const payloadHash = createHash('sha256')
        .update(input.rawPayload)
        .digest('hex');
      const existingReceipt =
        await this.prisma.paymentCallbackReceipt.findFirst({
          where: { providerTxnId: input.providerTxnId },
        });
      if (existingReceipt) {
        if (existingReceipt.payloadHash === payloadHash) {
          return { ok: true, order: this.toOrderModel(order) };
        }
        this.paymentMetricsService.markTxnConflict();
        return {
          ok: false,
          error: {
            code: 'PAYMENT_CALLBACK_TXN_CONFLICT',
            message:
              'Provider transaction id conflicts with another callback payload',
          },
        };
      }

      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        await tx.paymentCallbackReceipt.create({
          data: {
            orderId: input.orderId,
            providerTxnId: input.providerTxnId,
            nonce: callbackPayload.nonce,
            payloadHash,
            requestId: requestMeta?.requestId ?? callbackPayload.requestId,
            sourceIp: requestMeta?.sourceIp ?? callbackPayload.sourceIp,
          },
        });

        const paymentAttempt =
          existingAttempt ??
          (await tx.paymentAttempt.create({
            data: {
              orderId: input.orderId,
              channel: 'TELEBIRR_APP',
              state: PaymentState.PENDING,
            },
          }));

        await tx.paymentAttempt.update({
          where: { id: paymentAttempt.id },
          data: {
            state: callbackState,
            providerTxnId: input.providerTxnId,
            rawCallback: input.rawPayload,
            callbackAt: new Date(),
          },
        });

        let targetState = order.state;
        let targetPaymentState = order.paymentState;
        if (callbackSuccess && order.state === OrderState.PENDING_PAYMENT) {
          let deliveryAutoAccept = false;
          if (order.deliveryType === DeliveryType.DELIVERY) {
            const cfg = await tx.shopDeliveryConfig.findUnique({
              where: { shopId: order.shopId },
            });
            deliveryAutoAccept = Boolean(
              (cfg as { deliveryAutoAccept?: boolean } | null)
                ?.deliveryAutoAccept,
            );
          }
          targetState = deliveryAutoAccept
            ? OrderState.PREPARING
            : OrderState.PAID;
          targetPaymentState = PaymentState.SUCCESS;
        } else if (
          !callbackSuccess &&
          order.state === OrderState.PENDING_PAYMENT
        ) {
          targetState = OrderState.PAYMENT_FAILED;
          targetPaymentState = PaymentState.FAILED;
        } else if (
          !callbackSuccess &&
          (order.state === OrderState.PAID ||
            order.state === OrderState.COMPLETED)
        ) {
          // Ignore late failed callbacks after successful settlement.
          targetState = order.state;
          targetPaymentState = order.paymentState;
        } else if (
          callbackSuccess &&
          order.state !== OrderState.PAID &&
          order.state !== OrderState.PENDING_PAYMENT
        ) {
          throw new DomainError(
            'ORDER_STATE_INVALID_TRANSITION',
            'Order state does not allow payment success transition',
          );
        }

        const next = await tx.order.update({
          where: { id: order.id },
          data: {
            state: targetState,
            status: this.merchantStatusFromOrderState(targetState),
            paymentState: targetPaymentState,
            providerTxnId: input.providerTxnId,
            paidAt: callbackSuccess ? new Date() : order.paidAt,
          },
        });

        await tx.orderStatusLog.create({
          data: {
            orderId: order.id,
            fromState: order.state,
            toState: next.state,
            operatorType: 'PAYMENT_PROVIDER',
            reason: `payment_callback_${input.callbackStatus}`,
            metadata: { providerTxnId: input.providerTxnId },
          },
        });
        return next;
      });

      await this.paymentEventProducer.publish(
        callbackSuccess ? 'payment.succeeded' : 'payment.failed',
        {
          orderId: updatedOrder.id,
          providerTxnId: input.providerTxnId,
          callbackStatus: input.callbackStatus,
        },
      );
      if (callbackSuccess) {
        this.paymentMetricsService.markCallbackSuccess();
      } else {
        this.paymentMetricsService.markCallbackFailed();
      }

      if (callbackSuccess && updatedOrder.tableId) {
        void this.emitTableStatusChanged(updatedOrder.shopId, updatedOrder.tableId);
      }

      return { ok: true, order: this.toOrderModel(updatedOrder) };
    } catch (error) {
      if (error instanceof DomainError) {
        return {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }
      if (this.isUniqueConstraintError(error)) {
        this.paymentMetricsService.markReplayRejected();
        return {
          ok: false,
          error: {
            code: 'PAYMENT_CALLBACK_REPLAYED',
            message: 'Duplicated payment callback detected',
          },
        };
      }
      throw error;
    }
  }

  async applyCoupon(input: ApplyCouponInput): Promise<{
    ok: boolean;
    preview?: {
      couponCode: string;
      discountAmount: number;
      finalAmount: number;
    };
    error?: { code: string; message: string };
  }> {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        shopId: input.shopId,
        code: input.couponCode,
        active: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
      },
    });
    if (!coupon) {
      return {
        ok: false,
        error: { code: 'COUPON_INVALID', message: 'Coupon is invalid' },
      };
    }
    const discountAmount = Math.floor(
      (input.subtotalAmount * coupon.discountValue) / 100,
    );
    return {
      ok: true,
      preview: {
        couponCode: coupon.code,
        discountAmount,
        finalAmount: Math.max(0, input.subtotalAmount - discountAmount),
      },
    };
  }

  async availableCoupons(
    shopId: string,
  ): Promise<Array<{ code: string; discountValue: number }>> {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        shopId,
        active: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { discountValue: 'desc' },
      take: 20,
    });
    return coupons.map((c) => ({
      code: c.code,
      discountValue: c.discountValue,
    }));
  }

  async cancelOrder(
    input: CancelOrderInput,
    userId?: string,
  ): Promise<OrderPayload> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });
    if (!order) {
      return {
        ok: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      };
    }
    if (
      order.state !== OrderState.PENDING_PAYMENT &&
      order.state !== OrderState.PAYMENT_FAILED
    ) {
      return {
        ok: false,
        error: {
          code: 'ORDER_STATE_INVALID_TRANSITION',
          message: 'Order cannot be cancelled in current state',
        },
      };
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          state: OrderState.CANCELLED,
          status: PrismaOrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromState: order.state,
          toState: OrderState.CANCELLED,
          operatorType: 'CUSTOMER',
          operatorId: userId,
          reason: input.reason,
        },
      });
      return next;
    });
    return { ok: true, order: this.toOrderModel(updated) };
  }

  async acceptDeliveryOrder(
    input: AcceptDeliveryOrderInput,
    shopId?: string,
    operatorId?: string,
  ): Promise<OrderPayload> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });
    if (!order) {
      return {
        ok: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      };
    }
    if (order.deliveryType !== DeliveryType.DELIVERY) {
      return {
        ok: false,
        error: {
          code: 'ORDER_VALIDATION_FAILED',
          message: 'Only delivery orders can be accepted manually',
        },
      };
    }
    if (shopId && order.shopId !== shopId) {
      return {
        ok: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      };
    }
    if (order.state !== OrderState.PAID) {
      return {
        ok: false,
        error: {
          code: 'ORDER_STATE_INVALID_TRANSITION',
          message: 'Order state does not allow manual accept',
        },
      };
    }
    const next = await this.prisma.order.update({
      where: { id: order.id },
      data: { state: OrderState.PREPARING },
    });
    await this.prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromState: order.state,
        toState: OrderState.PREPARING,
        operatorType: 'STAFF',
        operatorId,
        reason: 'acceptDeliveryOrder',
        metadata: {},
      },
    });
    await this.paymentEventProducer.publish('order.status.updated', {
      orderId: order.id,
      fromState: order.state,
      toState: OrderState.PREPARING,
      deliveryType: order.deliveryType,
    });
    return { ok: true, order: this.toOrderModel(next) };
  }

  async markDeliveryOrderReady(
    input: MarkDeliveryOrderReadyInput,
    shopId?: string,
    operatorId?: string,
  ): Promise<OrderPayload> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });
    if (!order) {
      return {
        ok: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      };
    }
    if (order.deliveryType !== DeliveryType.DELIVERY) {
      return {
        ok: false,
        error: {
          code: 'ORDER_VALIDATION_FAILED',
          message: 'Only delivery orders can be marked ready',
        },
      };
    }
    if (shopId && order.shopId !== shopId) {
      return {
        ok: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      };
    }
    if (order.state !== OrderState.PREPARING) {
      return {
        ok: false,
        error: {
          code: 'ORDER_STATE_INVALID_TRANSITION',
          message: 'Order state does not allow marking ready',
        },
      };
    }

    const next = await this.prisma.order.update({
      where: { id: order.id },
      data: { state: OrderState.READY },
    });
    await this.prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromState: order.state,
        toState: OrderState.READY,
        operatorType: 'STAFF',
        operatorId,
        reason: 'markDeliveryOrderReady',
        metadata: {},
      },
    });
    await this.paymentEventProducer.publish('order.status.updated', {
      orderId: order.id,
      fromState: order.state,
      toState: OrderState.READY,
      deliveryType: order.deliveryType,
    });
    return { ok: true, order: this.toOrderModel(next) };
  }

  async deliveryOrders(
    shopId: string,
    filters?: DeliveryOrderFilterInput,
  ): Promise<OrderModel[]> {
    const page = Math.max(filters?.page ?? 1, 1);
    const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 100);
    const rows = await this.prisma.order.findMany({
      where: {
        shopId,
        deliveryType: DeliveryType.DELIVERY,
        ...(filters?.state ? { state: filters.state as OrderState } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return rows.map((row) => this.toOrderModel(row));
  }

  /**
   * 顾客端历史订单（MVP：不按 userId 过滤，全量最近单）。
   * 行价格以后端 unitPriceSnapshot 为准；嵌套 Product 用于名称与图片。
   */
  async getOrdersForCustomer(ids: string[]): Promise<OrderHistoryOrderModel[]> {
    const uniqueIds = Array.from(
      new Set(ids.map((id) => id.trim()).filter(Boolean)),
    ).slice(0, 50);
    if (uniqueIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.order.findMany({
      where: { id: { in: uniqueIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    return rows.map((o) => ({
      id: o.id,
      totalAmount: o.totalAmount,
      status: o.state,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((it) => ({
        quantity: it.quantity,
        priceAtTime: it.unitPriceSnapshot,
        product: {
          name: it.product?.name ?? it.productNameSnapshot,
          imageUrl: it.product?.imageUrl ?? null,
        },
      })),
    }));
  }

  /** 顾客端按 id 拉取单条订单（含门店、桌台、行项目+商品） */
  async getOrderByIdForCustomer(id: string): Promise<OrderDetailModel | null> {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        shop: { select: { name: true } },
        table: { select: { name: true } },
      },
    });
    if (!o) {
      return null;
    }
    return {
      id: o.id,
      orderNo: o.orderNo,
      totalAmount: o.totalAmount,
      status: o.state,
      createdAt: o.createdAt.toISOString(),
      shopName: o.shop.name,
      tableName: o.table?.name ?? null,
      deliveryType: o.deliveryType,
      items: o.items.map((it) => ({
        quantity: it.quantity,
        priceAtTime: it.unitPriceSnapshot,
        product: {
          name: it.product?.name ?? it.productNameSnapshot,
          imageUrl: it.product?.imageUrl ?? null,
        },
      })),
    };
  }

  /**
   * Merchant dispatch board: filter by `Order.shopId` (same scope as "merchant" in product UI).
   * Set MERCHANT_DISPATCH_DEBUG_ALL=true (non-production) to omit shop filter for debugging.
   */
  async merchantDispatchOrders(shopId: string): Promise<MerchantDispatchOrderModel[]> {
    const stateNotPaidDraft = {
      state: {
        notIn: [
          OrderState.DRAFT,
          OrderState.PENDING_PAYMENT,
          OrderState.PAYMENT_FAILED,
        ],
      },
    };

    const debugAllOrders =
      process.env.NODE_ENV !== 'production' &&
      process.env.MERCHANT_DISPATCH_DEBUG_ALL === 'true';

    if (debugAllOrders) {
      console.warn(
        '[merchantDispatchOrders] MERCHANT_DISPATCH_DEBUG_ALL=true: fetching all shops (dev only).',
      );
    }

    const rows = await this.prisma.order.findMany({
      where: debugAllOrders ? stateNotPaidDraft : { shopId, ...stateNotPaidDraft },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        items: { include: { product: true } },
        shop: { select: { name: true } },
        table: { select: { name: true } },
      },
    });
    return rows.map((o) => this.toMerchantDispatchOrder(o));
  }

  /**
   * Kitchen workflow: PENDING → PREPARING → COMPLETED, or cancel to CANCELLED.
   * Keeps `state` (OrderState) aligned with `status` (OrderStatus).
   */
  async updateMerchantOrderStatus(
    orderId: string,
    shopId: string,
    target: MerchantOrderStatus,
    operatorId?: string,
  ): Promise<MerchantDispatchOrderModel> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        shop: { select: { name: true } },
        table: { select: { name: true } },
      },
    });
    if (!order || order.shopId !== shopId) {
      throw new ForbiddenException('Order not found');
    }

    let nextState = order.state;
    let nextStatus = order.status;
    let completedAt = order.completedAt;
    let cancelledAt = order.cancelledAt;
    let acceptedAt = order.acceptedAt;

    if (target === MerchantOrderStatus.PREPARING) {
      if (order.status !== PrismaOrderStatus.PENDING) {
        throw new BadRequestException(
          'Only orders waiting for kitchen (PENDING) can be accepted',
        );
      }
      if (
        order.state !== OrderState.PAID &&
        order.state !== OrderState.READY
      ) {
        throw new BadRequestException(
          'Order payment or state does not allow preparation',
        );
      }
      nextState = OrderState.PREPARING;
      nextStatus = PrismaOrderStatus.PREPARING;
      acceptedAt = acceptedAt ?? new Date();
    } else if (target === MerchantOrderStatus.COMPLETED) {
      if (order.status !== PrismaOrderStatus.PREPARING) {
        throw new BadRequestException(
          'Only orders in PREPARING can be marked completed',
        );
      }
      if (
        order.state !== OrderState.PREPARING &&
        order.state !== OrderState.READY
      ) {
        throw new BadRequestException('Order state does not allow completion');
      }
      nextState = OrderState.COMPLETED;
      nextStatus = PrismaOrderStatus.COMPLETED;
      completedAt = new Date();
    } else if (target === MerchantOrderStatus.CANCELLED) {
      if (
        order.status === PrismaOrderStatus.COMPLETED ||
        order.status === PrismaOrderStatus.CANCELLED
      ) {
        throw new BadRequestException('Order is already in a final state');
      }
      nextState = OrderState.CANCELLED;
      nextStatus = PrismaOrderStatus.CANCELLED;
      cancelledAt = new Date();
    } else {
      throw new BadRequestException('Unsupported status transition');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.order.update({
        where: { id: orderId },
        data: {
          state: nextState,
          status: nextStatus,
          acceptedAt,
          completedAt,
          cancelledAt,
        },
      });
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          fromState: order.state,
          toState: nextState,
          operatorType: 'ADMIN',
          operatorId: operatorId ?? null,
          reason: `merchant_dispatch_${target}`,
          metadata: { merchantStatus: target },
        },
      });
      return tx.order.findUniqueOrThrow({
        where: { id: row.id },
        include: {
          items: { include: { product: true } },
          shop: { select: { name: true } },
          table: { select: { name: true } },
        },
      });
    });

    if (order.tableId) {
      void this.emitTableStatusChanged(shopId, order.tableId);
    }

    return this.toMerchantDispatchOrder(updated);
  }

  private async emitTableStatusChanged(
    shopId: string,
    tableId: string,
  ): Promise<void> {
    try {
      const table = await this.tableService.getTableById(shopId, tableId);
      if (table) {
        await this.pubSub.publish('tableStatusChanged', {
          tableStatusChanged: table,
        });
      }
    } catch (err) {
      this.logger.warn(
        `emitTableStatusChanged failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private initialMerchantStatus(state: OrderState): PrismaOrderStatus {
    switch (state) {
      case OrderState.PREPARING:
        return PrismaOrderStatus.PREPARING;
      case OrderState.COMPLETED:
        return PrismaOrderStatus.COMPLETED;
      case OrderState.CANCELLED:
        return PrismaOrderStatus.CANCELLED;
      default:
        return PrismaOrderStatus.PENDING;
    }
  }

  private merchantStatusFromOrderState(state: string): PrismaOrderStatus {
    switch (state) {
      case 'PREPARING':
      case 'READY':
        return PrismaOrderStatus.PREPARING;
      case 'COMPLETED':
        return PrismaOrderStatus.COMPLETED;
      case 'CANCELLED':
      case 'REFUNDED':
        return PrismaOrderStatus.CANCELLED;
      case 'PAID':
        return PrismaOrderStatus.PENDING;
      default:
        return PrismaOrderStatus.PENDING;
    }
  }

  private toMerchantDispatchOrder(o: {
    id: string;
    orderNo: string;
    totalAmount: number;
    status: PrismaOrderStatus;
    state: string;
    createdAt: Date;
    acceptedAt: Date | null;
    completedAt: Date | null;
    shop: { name: string };
    table: { name: string } | null;
    items: Array<{
      quantity: number;
      productNameSnapshot: string;
      product: { name: string; imageUrl: string | null } | null;
    }>;
  }): MerchantDispatchOrderModel {
    return {
      id: o.id,
      orderNo: o.orderNo,
      totalAmount: o.totalAmount,
      status: o.status as MerchantOrderStatus,
      orderState: o.state as OrderState,
      createdAt: o.createdAt.toISOString(),
      shopName: o.shop.name,
      tableName: o.table?.name ?? null,
      acceptedAt: o.acceptedAt?.toISOString() ?? null,
      completedAt: o.completedAt?.toISOString() ?? null,
      items: o.items.map((it) => ({
        productName: it.product?.name ?? it.productNameSnapshot,
        quantity: it.quantity,
        imageUrl: it.product?.imageUrl ?? null,
      })),
    };
  }

  private toOrderModel(order: {
    id: string;
    orderNo: string;
    state: string;
    paymentState: string;
    totalAmount: number;
    deliveryType?: string;
  }): OrderModel {
    return {
      id: order.id,
      orderNo: order.orderNo,
      state: order.state as OrderState,
      paymentState: order.paymentState as PaymentState,
      totalAmount: order.totalAmount,
      deliveryType: (order.deliveryType ??
        DeliveryType.DINE_IN) as DeliveryType,
    };
  }

  /**
   * 仅使用 Prisma 返回的 unitPrice（分，整数）与行数量计算行小计与 subtotalAmount。
   * 不读取 input 中任何价格类字段（CreateOrderInput 亦不含此类字段）。
   */
  private buildServerAuthoritativeLineItems(
    orderLines: CreateOrderInput['items'],
    productsById: Map<string, Product>,
  ): {
    itemRows: Array<{
      productId: string;
      productNameSnapshot: string;
      unitPriceSnapshot: number;
      quantity: number;
      subtotal: number;
      remark?: string;
    }>;
    subtotalAmount: number;
  } {
    let subtotalAmount = 0;
    const itemRows = orderLines.map((line) => {
      // 与上文 findMany 校验一致：每个 line.productId 均在 productsById 中
      const product = productsById.get(line.productId)!;
      const unitPriceCents = product.unitPrice;
      const qty = line.amount;
      const lineSubtotalCents = unitPriceCents * qty;
      subtotalAmount += lineSubtotalCents;
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceSnapshot: unitPriceCents,
        quantity: qty,
        subtotal: lineSubtotalCents,
        remark: line.remark,
      };
    });
    return { itemRows, subtotalAmount };
  }

  /**
   * Continuous ordering: merge new lines into an unpaid dine-in order for the same table/user.
   * Does not emit `tableStatusChanged` (table already occupied).
   */
  private async appendItemsToExistingOrder(params: {
    activeOrderId: string;
    shopId: string;
    tableId: string;
    actorUserId: string;
    itemRows: Array<{
      productId: string;
      productNameSnapshot: string;
      unitPriceSnapshot: number;
      quantity: number;
      subtotal: number;
      remark?: string;
    }>;
    addedSubtotal: number;
  }): Promise<{
    id: string;
    orderNo: string;
    state: string;
    paymentState: string;
    totalAmount: number;
    deliveryType: string;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({
        where: {
          id: params.activeOrderId,
          shopId: params.shopId,
          tableId: params.tableId,
          userId: params.actorUserId,
          status: {
            in: [PrismaOrderStatus.PENDING, PrismaOrderStatus.PREPARING],
          },
          state: OrderState.PENDING_PAYMENT,
          deliveryType: DeliveryType.DINE_IN,
        },
      });
      if (!current) {
        throw new DomainError(
          'ORDER_APPEND_STALE',
          'Open order is no longer available for adding items',
        );
      }

      for (const row of params.itemRows) {
        await tx.orderItem.create({
          data: {
            orderId: current.id,
            productId: row.productId,
            productNameSnapshot: row.productNameSnapshot,
            unitPriceSnapshot: row.unitPriceSnapshot,
            quantity: row.quantity,
            subtotal: row.subtotal,
            remark: row.remark,
          },
        });
      }

      const newSubtotal = current.subtotalAmount + params.addedSubtotal;
      const deliveryFee =
        current.deliveryType === DeliveryType.DELIVERY
          ? (current.deliveryFee ?? 0)
          : 0;
      const discountAmount = current.discountAmount;
      const newTotal = Math.max(0, newSubtotal - discountAmount + deliveryFee);

      const prevSnap = current.pricingSnapshot as Record<string, unknown>;
      const prevItems = Array.isArray(prevSnap.items)
        ? (prevSnap.items as unknown[])
        : [];
      const newPricingSnapshot = {
        ...prevSnap,
        subtotalAmount: newSubtotal,
        discountAmount,
        deliveryFee,
        totalAmount: newTotal,
        currency: 'ETB_CENT',
        items: [...prevItems, ...params.itemRows],
      };

      await tx.order.update({
        where: { id: current.id },
        data: {
          subtotalAmount: newSubtotal,
          totalAmount: newTotal,
          pricingSnapshot: newPricingSnapshot as Prisma.InputJsonValue,
        },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: current.id,
          fromState: current.state,
          toState: current.state,
          operatorType: 'CUSTOMER',
          operatorId: params.actorUserId,
          reason: 'order_append_items',
          metadata: {
            addedSubtotal: params.addedSubtotal,
            lineCount: params.itemRows.length,
          },
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: current.id },
        select: {
          id: true,
          orderNo: true,
          state: true,
          paymentState: true,
          totalAmount: true,
          deliveryType: true,
        },
      });
    });
  }

  /**
   * 堂食桌台柔性降级：若请求的 tableId 在本店不存在或不可用，则为该店 upsert 测试桌（VIP-1），
   * 保证 Redis 扣库存与订单落库不被「桌台未关联」阻断。
   */
  private async resolveDineInTableId(
    shopId: string,
    requestedTableId: string,
  ): Promise<string> {
    const existing = await this.prisma.diningTable.findFirst({
      where: {
        shopId,
        OR: [{ id: requestedTableId }, { name: requestedTableId }],
      },
    });
    if (existing) {
      return existing.id;
    }

    const demoTableId = 'test-table-001';
    const demoTableName = 'VIP-1';

    const table = await this.prisma.diningTable.upsert({
      where: {
        shopId_name: {
          shopId,
          name: demoTableName,
        },
      },
      create: {
        id: demoTableId,
        shopId,
        name: demoTableName,
      },
      update: {},
    });
    return table.id;
  }

  /**
   * 任意桌台标识（tableId 或 tableNumber）存在时强制堂食，且不产生配送费。
   */
  private resolveCreateOrderDeliveryTypeAndTableRef(input: CreateOrderInput): {
    tableRef: string;
    deliveryType: DeliveryType;
  } {
    const tableRef =
      input.tableId?.trim() || input.tableNumber?.trim() || '';
    let deliveryType = input.deliveryType ?? DeliveryType.DINE_IN;
    if (tableRef) {
      deliveryType = DeliveryType.DINE_IN;
    }
    return { tableRef, deliveryType };
  }

  private buildRequestHash(input: CreateOrderInput): string {
    const { deliveryType } = this.resolveCreateOrderDeliveryTypeAndTableRef(input);
    const normalized = {
      shopId: input.shopId,
      tableId: input.tableId ?? '',
      tableNumber: input.tableNumber ?? '',
      idempotencyKey: input.idempotencyKey,
      paymentMethod: input.paymentMethod,
      deliveryType,
      addressId: input.addressId ?? '',
      couponCode: input.couponCode ?? '',
      note: input.note ?? '',
      items: [...input.items]
        .map((item) => ({
          productId: item.productId,
          amount: item.amount,
          remark: item.remark ?? '',
        }))
        .sort((a, b) => a.productId.localeCompare(b.productId)),
    };
    return createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
  }

  private parseAndValidateCallbackPayload(rawPayload: string): CallbackPayload {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawPayload);
    } catch {
      throw new DomainError(
        'PAYMENT_CALLBACK_INVALID_PAYLOAD',
        'Invalid callback payload',
      );
    }

    const payload = parsed as Partial<CallbackPayload>;
    if (!payload.nonce || typeof payload.nonce !== 'string') {
      throw new DomainError(
        'PAYMENT_CALLBACK_INVALID_PAYLOAD',
        'Missing callback nonce',
      );
    }
    if (
      typeof payload.timestamp !== 'number' ||
      !Number.isFinite(payload.timestamp)
    ) {
      throw new DomainError(
        'PAYMENT_CALLBACK_INVALID_PAYLOAD',
        'Missing callback timestamp',
      );
    }

    const now = Date.now();
    const driftMs = Math.abs(now - payload.timestamp);
    const allowedDriftMs = 5 * 60 * 1000;
    if (driftMs > allowedDriftMs) {
      throw new DomainError(
        'PAYMENT_CALLBACK_EXPIRED',
        'Payment callback is outside allowed time window',
      );
    }

    if (payload.requestId && typeof payload.requestId !== 'string') {
      throw new DomainError(
        'PAYMENT_CALLBACK_INVALID_PAYLOAD',
        'Invalid callback requestId',
      );
    }
    if (payload.sourceIp && typeof payload.sourceIp !== 'string') {
      throw new DomainError(
        'PAYMENT_CALLBACK_INVALID_PAYLOAD',
        'Invalid callback sourceIp',
      );
    }

    return {
      nonce: payload.nonce,
      timestamp: payload.timestamp,
      requestId: payload.requestId,
      sourceIp: payload.sourceIp,
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const code = (error as { code?: string }).code;
    return code === 'P2002';
  }

  async myAddresses(userId?: string): Promise<
    Array<{
      id: string;
      receiverName: string;
      phone: string;
      detailAddress: string;
      isDefault: boolean;
    }>
  > {
    const actorUserId = userId ?? 'user_placeholder';
    const rows = await this.prisma.userAddress.findMany({
      where: { userId: actorUserId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      receiverName: row.receiverName,
      phone: row.phone,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    }));
  }

  async createAddress(
    input: CreateAddressInput,
    userId?: string,
  ): Promise<{
    id: string;
    receiverName: string;
    phone: string;
    detailAddress: string;
    isDefault: boolean;
  }> {
    const actorUserId = userId ?? 'user_placeholder';
    const created = await this.prisma.userAddress.create({
      data: {
        userId: actorUserId,
        receiverName: input.receiverName,
        phone: input.phone,
        detailAddress: input.detailAddress,
        latitude: input.latitude,
        longitude: input.longitude,
        isDefault: input.isDefault ?? false,
      },
    });
    return {
      id: created.id,
      receiverName: created.receiverName,
      phone: created.phone,
      detailAddress: created.detailAddress,
      isDefault: created.isDefault,
    };
  }

  async updateAddress(
    addressId: string,
    input: UpdateAddressInput,
    userId?: string,
  ): Promise<{
    id: string;
    receiverName: string;
    phone: string;
    detailAddress: string;
    isDefault: boolean;
  }> {
    const actorUserId = userId ?? 'user_placeholder';
    const updated = await this.prisma.userAddress.updateMany({
      where: { id: addressId, userId: actorUserId },
      data: {
        receiverName: input.receiverName,
        phone: input.phone,
        detailAddress: input.detailAddress,
        latitude: input.latitude,
        longitude: input.longitude,
        isDefault: input.isDefault ?? false,
      },
    });
    if (updated.count === 0) {
      throw new DomainError('ADDRESS_NOT_FOUND', 'Address not found');
    }
    const latest = await this.prisma.userAddress.findMany({
      where: { id: addressId, userId: actorUserId },
      take: 1,
    });
    const row = latest[0];
    return {
      id: row.id,
      receiverName: row.receiverName,
      phone: row.phone,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    };
  }

  async deleteAddress(addressId: string, userId?: string): Promise<boolean> {
    const actorUserId = userId ?? 'user_placeholder';
    const res = await this.prisma.userAddress.deleteMany({
      where: { id: addressId, userId: actorUserId },
    });
    return res.count > 0;
  }

  async deliveryConfig(shopId: string): Promise<{
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    dineInEnabled: boolean;
    deliveryRadius?: number;
    deliveryFeeType: DeliveryFeeType;
    fixedFee?: number;
    freeDeliveryThreshold?: number;
    deliveryAcceptMode: DeliveryAcceptMode;
    dineInOpenTime?: string;
    pickupOpenTime?: string;
    deliveryOpenTime?: string;
  }> {
    const cfg = await this.prisma.shopDeliveryConfig.findUnique({
      where: { shopId },
    });
    return {
      deliveryEnabled: cfg?.deliveryEnabled ?? false,
      pickupEnabled: cfg?.pickupEnabled ?? true,
      dineInEnabled: cfg?.dineInEnabled ?? true,
      deliveryRadius: cfg?.deliveryRadius ?? undefined,
      deliveryFeeType: (cfg?.deliveryFeeType ??
        DeliveryFeeType.FIXED) as DeliveryFeeType,
      fixedFee: cfg?.fixedFee ?? undefined,
      freeDeliveryThreshold: cfg?.freeDeliveryThreshold ?? undefined,
      deliveryAcceptMode: (cfg as { deliveryAutoAccept?: boolean } | null)
        ?.deliveryAutoAccept
        ? DeliveryAcceptMode.AUTO
        : DeliveryAcceptMode.MANUAL,
      dineInOpenTime: cfg?.dineInOpenTime ?? undefined,
      pickupOpenTime: cfg?.pickupOpenTime ?? undefined,
      deliveryOpenTime: cfg?.deliveryOpenTime ?? undefined,
    };
  }

  async updateDeliveryConfig(
    shopId: string,
    input: DeliveryConfigInput,
  ): Promise<{
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    dineInEnabled: boolean;
    deliveryRadius?: number;
    deliveryFeeType: DeliveryFeeType;
    fixedFee?: number;
    freeDeliveryThreshold?: number;
    deliveryAcceptMode: DeliveryAcceptMode;
    dineInOpenTime?: string;
    pickupOpenTime?: string;
    deliveryOpenTime?: string;
  }> {
    const cfg = await this.prisma.shopDeliveryConfig.upsert({
      where: { shopId },
      update: {
        deliveryEnabled: input.deliveryEnabled ?? undefined,
        pickupEnabled: input.pickupEnabled ?? undefined,
        dineInEnabled: input.dineInEnabled ?? undefined,
        deliveryRadius: input.deliveryRadius ?? undefined,
        deliveryFeeType: input.deliveryFeeType ?? undefined,
        fixedFee: input.fixedFee ?? undefined,
        freeDeliveryThreshold: input.freeDeliveryThreshold ?? undefined,
        dineInOpenTime: input.dineInOpenTime ?? undefined,
        pickupOpenTime: input.pickupOpenTime ?? undefined,
        deliveryOpenTime: input.deliveryOpenTime ?? undefined,
        deliveryAutoAccept:
          input.deliveryAcceptMode === undefined
            ? undefined
            : input.deliveryAcceptMode === DeliveryAcceptMode.AUTO,
      } as never,
      create: {
        shopId,
        deliveryEnabled: input.deliveryEnabled ?? false,
        pickupEnabled: input.pickupEnabled ?? true,
        dineInEnabled: input.dineInEnabled ?? true,
        deliveryRadius: input.deliveryRadius,
        deliveryFeeType: input.deliveryFeeType ?? DeliveryFeeType.FIXED,
        fixedFee: input.fixedFee,
        freeDeliveryThreshold: input.freeDeliveryThreshold,
        dineInOpenTime: input.dineInOpenTime,
        pickupOpenTime: input.pickupOpenTime,
        deliveryOpenTime: input.deliveryOpenTime,
        deliveryAutoAccept:
          input.deliveryAcceptMode === DeliveryAcceptMode.AUTO,
      } as never,
    });
    return {
      deliveryEnabled: cfg.deliveryEnabled,
      pickupEnabled: cfg.pickupEnabled,
      dineInEnabled: cfg.dineInEnabled,
      deliveryRadius: cfg.deliveryRadius ?? undefined,
      deliveryFeeType: cfg.deliveryFeeType as DeliveryFeeType,
      fixedFee: cfg.fixedFee ?? undefined,
      freeDeliveryThreshold: cfg.freeDeliveryThreshold ?? undefined,
      deliveryAcceptMode: (cfg as { deliveryAutoAccept?: boolean })
        .deliveryAutoAccept
        ? DeliveryAcceptMode.AUTO
        : DeliveryAcceptMode.MANUAL,
      dineInOpenTime: cfg.dineInOpenTime ?? undefined,
      pickupOpenTime: cfg.pickupOpenTime ?? undefined,
      deliveryOpenTime: cfg.deliveryOpenTime ?? undefined,
    };
  }

  /** 顾客端公开：门店上架商品菜单，单价为数据库 unitPrice（分，整数） */
  async shopMenuProducts(shopId: string): Promise<ShopMenuProductModel[]> {
    const rows = await this.prisma.product.findMany({
      where: { shopId, active: true, status: 'ACTIVE' } as Record<
        string,
        unknown
      >,
      orderBy: { name: 'asc' },
      take: 500,
    });
    return rows.map((row) => {
      const r = row as Product & { category?: string; imageUrl?: string | null };
      return {
        id: r.id,
        name: r.name,
        category: typeof r.category === 'string' ? r.category : 'General',
        unitPrice: r.unitPrice,
        imageUrl:
          typeof r.imageUrl === 'string' && r.imageUrl.length > 0
            ? r.imageUrl
            : undefined,
      };
    });
  }

  async checkDelivery(
    shopId: string,
    address: AddressInput,
  ): Promise<{ deliverable: boolean; estimatedFee: number; reason?: string }> {
    const cfg = await this.prisma.shopDeliveryConfig.findUnique({
      where: { shopId },
    });
    if (!cfg?.deliveryEnabled) {
      return {
        deliverable: false,
        estimatedFee: 0,
        reason: 'Delivery is not enabled for this shop',
      };
    }
    if (
      cfg.deliveryRadius &&
      (typeof address.latitude !== 'number' ||
        typeof address.longitude !== 'number')
    ) {
      return {
        deliverable: false,
        estimatedFee: 0,
        reason: 'Address coordinates are required for radius check',
      };
    }
    return {
      deliverable: true,
      estimatedFee: cfg.fixedFee ?? 0,
    };
  }

  private buildPickupCode(): string {
    return `${Math.floor(100000 + Math.random() * 900000)}`;
  }
}
