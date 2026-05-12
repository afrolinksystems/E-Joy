# E-Joy PRD2.1 开发冻结补丁（v2.1.1）

> 基于 `docs/PRD2.1.md` 的可开发化补丁。  
> 目标：把“方向正确的 PRD”收敛为“可直接编码、可测试、可验收”的冻结规范。  
> 生成时间：2026-04-01 16:20 EAT

## 1. 冻结结论

- 开发状态：`Conditional Go` -> 通过本补丁后转为 `Go`
- 冻结范围：服务员端、餐厅管理员端、系统后台端、打印、配送、地址管理
- 冻结版本：`v2.1.1-freeze`

## 2. 技术与协议收敛（必须统一）

- **主协议**：GraphQL（Query/Mutation/Subscription）
- **REST 保留范围**：
  - 第三方回调（支付/打印设备回执）
  - 健康检查与运维探针
- **命名空间拆分**：
  - `restaurant-manager`（门店管理域）
  - `platform-admin`（平台管理域）
  - 禁止继续混用 `/admin/*` 承载两类角色语义

## 3. 角色与鉴权冻结

### 3.1 角色定义

- `customer`
- `staff`
- `manager`（餐厅管理员）
- `platform_admin`（系统管理员）

### 3.2 JWT Claims（冻结）

```json
{
  "sub": "user_or_staff_id",
  "role": "customer|staff|manager|platform_admin",
  "shopId": "shop_xxx_or_null",
  "scope": ["ticket:read", "ticket:write", "staff:manage", "platform:review"]
}
```

### 3.3 权限规则（关键）

- `staff/manager` 只能访问 `shopId` 归属数据
- `platform_admin` 可跨店访问，但写操作必须二次验证
- 所有敏感写操作必须审计：`requestId`, `actorId`, `actorRole`, `shopId`, `before`, `after`, `ip`

## 4. 状态机冻结（实现约束）

### 4.1 服务工单 `ServiceTicket`

- 状态：`OPEN -> ACCEPTED -> RESOLVED`
- 规则：
  - 仅 `OPEN` 可 `ACCEPTED`
  - 仅 `ACCEPTED` 可 `RESOLVED`
  - 仅接单人可执行 `RESOLVED`

### 4.2 打印任务 `PrintJob`

- 状态：`PENDING -> SUCCESS | FAILED`
- 规则：
  - 失败自动重试最多 3 次
  - 超过重试次数转 `FAILED` 并触发告警事件

### 4.3 外卖订单 `DeliveryOrder`（在 Order 上扩展）

- 状态建议：`PENDING_ACCEPT -> ACCEPTED -> PREPARING -> READY -> COMPLETED | CANCELED`
- 手动接单模式下：创建后进入 `PENDING_ACCEPT`
- 自动接单模式下：直接进入 `ACCEPTED`

### 4.4 餐厅入驻审核 `ShopApplication`

- 状态：`PENDING -> APPROVED | REJECTED`
- `REJECTED` 必填 `rejectReason`

## 5. 实时与消息策略冻结

- **主方案**：GraphQL Subscription
  - `serviceTicketCreated`
  - `serviceTicketUpdated`
  - `orderStatusUpdated`
  - `printJobUpdated`
- **兜底方案**：10 秒轮询
- **事件总线**：Kafka（已有基础设施）
  - 主题建议：`order.created`, `print.job`, `ticket.updated`

## 6. 安全规范冻结

- 密码：`bcrypt`（cost >= 10）
- 推广码：6-8 位随机码 + 频率限制 + 防枚举（IP/账号限流）
- 敏感操作二次验证：
  - 场景：删除员工、修改考核规则、审核通过/驳回
  - 流程：先发起 challenge，再提交 code
- 重放防护：nonce + timestamp + TTL

## 7. API 冻结映射（GraphQL）

> 以下是本期必须实现的 P0/P1 字段，命名以现有代码风格为准。

### 7.1 Staff（P0）

- `staffLogin`
- `myCalls`
- `respondCall`

### 7.2 Restaurant Manager（P0）

- `staffs`
- `createStaff`
- `updateStaff`
- `deleteStaff`
- `printers`
- `createPrinter`
- `updatePrinter`
- `deletePrinter`
- `deliveryConfig`
- `updateDeliveryConfig`

### 7.3 Platform Admin（P0/P1）

- `pendingShops`
- `approveShopApplication`
- `rejectShopApplication`
- `platformCoupons`
- `createPlatformCoupon`

### 7.4 Customer Delivery（P0）

- `myAddresses`
- `createAddress`
- `updateAddress`
- `deleteAddress`
- `checkDelivery`
- `createOrder` 扩展 `deliveryType/addressId/pickupTime`

## 8. 数据模型落地顺序（Prisma Migration）

### 8.1 第 1 批（P0）

- `Staff`
- `ShopDeliveryConfig`
- `UserAddress`
- `Order` 扩展字段（deliveryType/addressId/deliveryFee/pickupCode）

### 8.2 第 2 批（P1）

- `StaffPerformance`
- `PerformanceRule`
- `PrinterConfig`
- `PrintJob`
- `ShopApplication`

### 8.3 第 3 批（P2）

- `PromotionLog`
- 打印日志增强索引
- 报表导出任务表（异步）

## 9. AC（验收标准）冻结

### 9.1 Staff 呼叫处理

- Given 有 OPEN 工单
- When staff 点击处理
- Then 工单状态变为 ACCEPTED，记录 `assignedStaffUserId/acceptedAt`

### 9.2 Manager 配送配置

- Given manager 在门店配置页面
- When 保存配送半径与规则
- Then `deliveryConfig` 可读回，`checkDelivery` 按新规则生效

### 9.3 Customer 地址与配送

- Given 顾客新增地址
- When 提交 `checkDelivery`
- Then 返回 `deliverable/fee/reason`

### 9.4 Platform 餐厅审核

- Given 平台有 PENDING 申请
- When 审核通过/驳回
- Then 状态正确迁移，驳回场景记录原因

## 10. 测试计划冻结

- 单元测试：状态机、费用计算、权限门禁
- 集成测试：GraphQL resolver + Prisma（含 shop 隔离）
- e2e：
  - 呼叫创建到处理闭环
  - 配送地址校验与下单
  - 打印任务重试到失败告警
  - 审核通过/驳回流程
- 非功能：
  - 呼叫推送延迟 < 2s（模拟环境）
  - `checkDelivery` < 200ms（P95）

## 11. 风险与应对

- 协议混用风险 -> 已冻结 GraphQL 优先
- 角色串权风险 -> claims + shopId 强隔离 + 审计
- 打印稳定性风险 -> 重试 + 告警 + 回放队列
- 导出性能风险 -> 异步导出，不走同步接口

## 12. 实施入口（可直接开工）

1. 先做 Prisma 第 1 批迁移与 GraphQL skeleton
2. 完成 Staff P0（登录/呼叫处理）
3. 完成 Manager P0（员工与配送配置）
4. 完成 Customer 配送与地址 P0
5. 再做打印与平台审核 P1

---

此文档即 `PRD2.1` 的开发冻结补丁，可作为任务拆分、接口实现与测试验收的统一依据。
