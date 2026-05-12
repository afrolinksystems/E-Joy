import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUserShopId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext<{ req?: { user?: { shopId?: string } } }>()
      .req;
    return req?.user?.shopId;
  },
);
