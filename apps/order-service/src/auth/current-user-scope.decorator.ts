import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUserScope = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string[] => {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext<{ req?: { user?: { scope?: string[] } } }>()
      .req;
    return req?.user?.scope ?? [];
  },
);
