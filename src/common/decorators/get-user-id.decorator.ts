import { type ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (request.user?.id ||
      'd1b2a3c4-e5f6-7a8b-9c0d-1e2f3a4b5c6d') as string;
  },
);
