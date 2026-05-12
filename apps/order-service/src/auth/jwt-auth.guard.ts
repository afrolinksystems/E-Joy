import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

/** MVP：与 admin-web VITE_ADMIN_BEARER_TOKEN 对齐的本地演示令牌（非 JWT，禁止用于生产）。 */
const DEMO_ADMIN_BEARER = 'demo_admin_token';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = this.getRequest(context) as {
      headers?: { authorization?: string; Authorization?: string };
      user?: unknown;
    };
    const raw = req.headers?.authorization ?? req.headers?.Authorization ?? '';
    const bearer =
      typeof raw === 'string' && raw.startsWith('Bearer ')
        ? raw.slice(7).trim()
        : undefined;
    /** AdminResolver.assertManagerAccess compares roles case-insensitively; JWT may send MANAGER. */
    const isDemoAdminBearer =
      process.env.NODE_ENV !== 'production' &&
      (bearer === DEMO_ADMIN_BEARER ||
        (typeof raw === 'string' && raw.includes(DEMO_ADMIN_BEARER)));
    if (isDemoAdminBearer) {
      const demoShopId =
        process.env.DEMO_ADMIN_SHOP_ID?.trim() || 'test-shop-001';
      const demoScopes = [
        'staff:read',
        'staff:write',
        'printer:read',
        'printer:write',
        'delivery:write',
        'platform:read',
        'platform:write',
      ] as const;
      // Hard-coded demo identity: maps token to test shop (Prisma column is `shopId`).
      // `scope` → @CurrentUserScope; `permissions` mirrors for UI.
      req.user = {
        sub: 'demo-admin-id',
        id: 'demo-admin-id',
        merchantId: demoShopId,
        shopId: demoShopId,
        role: 'manager',
        roles: ['MANAGER', 'ADMIN'],
        permissions: [...demoScopes],
        scope: [...demoScopes],
      };
      return true;
    }
    return (await super.canActivate(context)) as boolean;
  }
}
