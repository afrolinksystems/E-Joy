import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req as { user?: { role?: string } };
    const role = req.user?.role?.toLowerCase();
    const allowed = required.map((r) => r.toLowerCase());
    if (role && allowed.includes(role)) {
      return true;
    }
    throw new ForbiddenException('Insufficient role for this operation');
  }
}
