// apps/order-service/src/order/inventory.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class InventoryService {
  private readonly redisClient: Redis;

  // 架构师防呆：Lua 脚本保证高并发下的原子性扣减
  private readonly DEDUCT_SCRIPT = `
    local current_stock = tonumber(redis.call('get', KEYS[1]))
    local requested = tonumber(ARGV[1])
    
    if current_stock == nil then
        return -1 -- 库存键不存在（按业务逻辑可视为无限库存或报错）
    elseif current_stock >= requested then
        redis.call('decrby', KEYS[1], requested)
        return 1  -- 成功
    else
        return 0  -- 失败：库存不足
    end
  `;

  constructor() {
    // 生产环境应从 ConfigService 获取
    this.redisClient = new Redis(
      process.env.REDIS_URL || 'redis://localhost:6379/0',
    );
  }

  async atomicDeduct(
    productId: string,
    quantity: number = 1,
  ): Promise<boolean> {
    const key = `ejoy:stock:${productId}`;

    // 使用 eval 执行 Lua 脚本
    const result = await this.redisClient.eval(
      this.DEDUCT_SCRIPT,
      1, // KEYS 的数量
      key,
      quantity,
    );

    if (result === 1) {
      return true;
    } else if (result === 0) {
      throw new ConflictException(`Product ${productId} out of stock`);
    } else {
      // 边缘兜底：假设商品未设置 Redis 库存限制，默认放行（或抛错，取决于你的设计）
      return true;
    }
  }
}
