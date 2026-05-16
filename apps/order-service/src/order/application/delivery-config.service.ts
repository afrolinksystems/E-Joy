import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddressInput, DeliveryConfigInput } from '../order.inputs';
import {
  DeliveryAcceptMode,
  DeliveryFeeType,
  ShopDeliveryConfigModel,
} from '../order.types';

@Injectable()
export class DeliveryConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async deliveryConfig(shopId: string): Promise<ShopDeliveryConfigModel> {
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
  ): Promise<ShopDeliveryConfigModel> {
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
}
