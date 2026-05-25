import {
  type ExecutionContext,
  UnauthorizedException,
  createParamDecorator, //crear atajos
} from '@nestjs/common';

export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.user?.id; //revisa si se dejo guardado informacion del usuario

    if (!userId) {
      throw new UnauthorizedException('Usuario no encontrado en el contexto');
    }

    return userId as string;
  },
);
