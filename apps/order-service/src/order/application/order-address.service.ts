import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainError } from '../domain/domain-error';
import { CreateAddressInput, UpdateAddressInput } from '../order.inputs';

export type UserAddressResult = {
  id: string;
  receiverName: string;
  phone: string;
  detailAddress: string;
  isDefault: boolean;
};

@Injectable()
export class OrderAddressService {
  constructor(private readonly prisma: PrismaService) {}

  async myAddresses(userId?: string): Promise<UserAddressResult[]> {
    const actorUserId = userId ?? 'user_placeholder';
    const rows = await this.prisma.userAddress.findMany({
      where: { userId: actorUserId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => this.toAddressResult(row));
  }

  async createAddress(
    input: CreateAddressInput,
    userId?: string,
  ): Promise<UserAddressResult> {
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
    return this.toAddressResult(created);
  }

  async updateAddress(
    addressId: string,
    input: UpdateAddressInput,
    userId?: string,
  ): Promise<UserAddressResult> {
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
    const [row] = await this.prisma.userAddress.findMany({
      where: { id: addressId, userId: actorUserId },
      take: 1,
    });
    return this.toAddressResult(row);
  }

  async deleteAddress(addressId: string, userId?: string): Promise<boolean> {
    const actorUserId = userId ?? 'user_placeholder';
    const result = await this.prisma.userAddress.deleteMany({
      where: { id: addressId, userId: actorUserId },
    });
    return result.count > 0;
  }

  private toAddressResult(row: UserAddressResult): UserAddressResult {
    return {
      id: row.id,
      receiverName: row.receiverName,
      phone: row.phone,
      detailAddress: row.detailAddress,
      isDefault: row.isDefault,
    };
  }
}
