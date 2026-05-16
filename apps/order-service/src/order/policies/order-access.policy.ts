import { ForbiddenException } from '@nestjs/common';

export type MerchantDispatchMode = 'read' | 'write';

export function assertMerchantDispatchAccess(
  role: string | undefined,
  scope: string[] | undefined,
  mode: MerchantDispatchMode,
): void {
  const normalizedRole = role?.toLowerCase();
  const allowed =
    normalizedRole === 'staff' ||
    normalizedRole === 'manager' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'platform_admin';
  if (!allowed) {
    throw new ForbiddenException('Merchant access required');
  }
  if (normalizedRole === 'admin' || normalizedRole === 'platform_admin') {
    return;
  }
  const requiredScope = mode === 'read' ? 'staff:read' : 'staff:write';
  if (!(scope ?? []).includes(requiredScope)) {
    throw new ForbiddenException(`Missing ${requiredScope} scope`);
  }
}

export function resolveMerchantShopId(
  shopId: string | undefined,
  currentShopId: string | undefined,
): string {
  const effectiveShopId = shopId ?? currentShopId;
  if (!effectiveShopId) {
    throw new ForbiddenException('Shop context is required');
  }
  if (currentShopId && shopId && currentShopId !== shopId) {
    throw new ForbiddenException('Shop scope mismatch');
  }
  return effectiveShopId;
}

export function assertManagerDeliveryWrite(
  role: string | undefined,
  scope: string[] | undefined,
): void {
  const normalizedRole = role?.toLowerCase();
  const allowedRole =
    normalizedRole === 'manager' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'platform_admin';
  if (!allowedRole) {
    throw new ForbiddenException('Manager role required');
  }
  if (
    normalizedRole !== 'admin' &&
    normalizedRole !== 'platform_admin' &&
    !(scope ?? []).includes('delivery:write')
  ) {
    throw new ForbiddenException('Missing delivery:write scope');
  }
}

export function assertShopScope(
  shopId: string,
  currentShopId: string | undefined,
): void {
  if (currentShopId && currentShopId !== shopId) {
    throw new ForbiddenException('Shop scope mismatch');
  }
}

export function assertSensitiveActionCode(code: string): void {
  const expected = process.env.ADMIN_SENSITIVE_OP_CODE?.trim();
  if (!expected) {
    throw new ForbiddenException('Sensitive operation code is not configured');
  }
  if (code !== expected) {
    throw new ForbiddenException('Second verification failed');
  }
}
