import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  DiningTableVisualState,
  OrderState,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TablePositionInput } from './table.inputs';
import { TableModel, TableStatus } from './table.types';

/** Open orders that reserve a table on the floor map (excludes terminal states). */
const ACTIVE_ORDER_STATES: OrderState[] = [
  OrderState.PENDING_PAYMENT,
  OrderState.PAID,
  OrderState.PREPARING,
  OrderState.READY,
];

@Injectable()
export class TableService {
  constructor(private readonly prisma: PrismaService) {}

  /** Single table for subscription payloads (same OCCUPIED derivation as getTables). */
  async getTableById(shopId: string, tableId: string): Promise<TableModel | null> {
    const row = await this.prisma.diningTable.findFirst({
      where: { id: tableId, shopId },
    });
    if (!row) {
      return null;
    }
    const occupiedIds = await this.occupiedTableIds(shopId);
    return this.toTableModel(row, occupiedIds.has(row.id));
  }

  async getTables(shopId: string): Promise<TableModel[]> {
    const tables = await this.prisma.diningTable.findMany({
      where: { shopId },
      orderBy: { name: 'asc' },
    });

    const openOrders = await this.prisma.order.findMany({
      where: {
        shopId,
        tableId: { not: null },
        state: { in: ACTIVE_ORDER_STATES },
      },
      select: { tableId: true },
    });
    const occupiedIds = new Set(
      openOrders
        .map((o) => o.tableId)
        .filter((id): id is string => Boolean(id)),
    );

    return tables.map((t) => this.toTableModel(t, occupiedIds.has(t.id)));
  }

  async updateTablePositions(
    shopId: string,
    input: TablePositionInput[],
  ): Promise<TableModel[]> {
    if (!input.length) {
      return this.getTables(shopId);
    }
    const ids = [...new Set(input.map((i) => i.id))];
    const rows = await this.prisma.diningTable.findMany({
      where: { shopId, id: { in: ids } },
      select: { id: true },
    });
    if (rows.length !== ids.length) {
      throw new BadRequestException(
        'One or more tables were not found for this shop',
      );
    }
    await this.prisma.$transaction(
      input.map((item) =>
        this.prisma.diningTable.update({
          where: { id: item.id },
          data: {
            posX: clamp01(item.posX),
            posY: clamp01(item.posY),
          },
        }),
      ),
    );
    return this.getTables(shopId);
  }

  async createTable(shopId: string): Promise<TableModel> {
    await this.prisma.shop.findFirstOrThrow({ where: { id: shopId } });
    const name = `Table ${Date.now().toString(36).toUpperCase()}`;
    const created = await this.prisma.diningTable.create({
      data: {
        shopId,
        name,
        capacity: 4,
        posX: 0.5,
        posY: 0.5,
        visualState: DiningTableVisualState.AVAILABLE,
      },
    });
    const occupiedIds = await this.occupiedTableIds(shopId);
    return this.toTableModel(created, occupiedIds.has(created.id));
  }

  async updateTable(
    shopId: string,
    tableId: string,
    tableNumber: string,
    capacity?: number | null,
  ): Promise<TableModel> {
    const trimmed = tableNumber.trim();
    if (!trimmed) {
      throw new BadRequestException('Table number is required');
    }
    if (
      capacity !== undefined &&
      capacity !== null &&
      (!Number.isInteger(capacity) || capacity < 1 || capacity > 99)
    ) {
      throw new BadRequestException('Capacity must be an integer from 1 to 99');
    }

    const row = await this.prisma.diningTable.findFirst({
      where: { id: tableId, shopId },
    });
    if (!row) {
      throw new ForbiddenException('Table not found');
    }

    const nameTaken = await this.prisma.diningTable.findFirst({
      where: { shopId, name: trimmed, NOT: { id: tableId } },
      select: { id: true },
    });
    if (nameTaken) {
      throw new ConflictException(
        'A table with this number already exists in this shop',
      );
    }

    const updated = await this.prisma.diningTable.update({
      where: { id: tableId },
      data: {
        name: trimmed,
        ...(capacity != null ? { capacity } : {}),
      },
    });
    const occupiedIds = await this.occupiedTableIds(shopId);
    return this.toTableModel(updated, occupiedIds.has(updated.id));
  }

  async deleteTable(shopId: string, tableId: string): Promise<boolean> {
    const row = await this.prisma.diningTable.findFirst({
      where: { id: tableId, shopId },
      select: { id: true },
    });
    if (!row) {
      throw new ForbiddenException('Table not found');
    }

    const blocking = await this.prisma.order.count({
      where: {
        tableId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING] },
      },
    });
    if (blocking > 0) {
      throw new BadRequestException(
        'Cannot delete this table while it has orders in PENDING or PREPARING status',
      );
    }

    await this.prisma.diningTable.delete({ where: { id: tableId } });
    return true;
  }

  async updateTablePosition(
    tableId: string,
    shopId: string,
    posX: number,
    posY: number,
  ): Promise<TableModel> {
    const row = await this.prisma.diningTable.findFirst({
      where: { id: tableId, shopId },
    });
    if (!row) {
      throw new ForbiddenException('Table not found');
    }
    const updated = await this.prisma.diningTable.update({
      where: { id: tableId },
      data: { posX: clamp01(posX), posY: clamp01(posY) },
    });
    const occupiedIds = await this.occupiedTableIds(shopId);
    return this.toTableModel(updated, occupiedIds.has(updated.id));
  }

  private async occupiedTableIds(shopId: string): Promise<Set<string>> {
    const openOrders = await this.prisma.order.findMany({
      where: {
        shopId,
        tableId: { not: null },
        state: { in: ACTIVE_ORDER_STATES },
      },
      select: { tableId: true },
    });
    return new Set(
      openOrders
        .map((o) => o.tableId)
        .filter((id): id is string => Boolean(id)),
    );
  }

  private toTableModel(
    t: {
      id: string;
      shopId: string;
      name: string;
      capacity: number;
      posX: number;
      posY: number;
      visualState: DiningTableVisualState;
    },
    hasActiveOrder: boolean,
  ): TableModel {
    let status: TableStatus;
    if (t.visualState === DiningTableVisualState.DIRTY) {
      status = TableStatus.DIRTY;
    } else if (hasActiveOrder) {
      status = TableStatus.OCCUPIED;
    } else {
      status = TableStatus.AVAILABLE;
    }
    return {
      id: t.id,
      tableNumber: t.name,
      capacity: t.capacity,
      posX: t.posX,
      posY: t.posY,
      status,
      shopId: t.shopId,
    };
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
