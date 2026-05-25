//verifica el rol que tienes y es para que no entres a lugares donde no te pertenece,
//ejemplo: no puedes entrar a la ruta de un medico si no eres medico, solo tu rol es paciente
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user?.roles || user.roles.length === 0) {
      throw new ForbiddenException('User information not found');
    }

    const userRoles = user.roles;
    const hasRole = this.allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para acceder a este recurso',
      );
    }

    return true;
  }
}

export function createRolesGuard(roles: string[]): RolesGuard {
  return new RolesGuard(roles);
}
//si no hay habria un fallo de autorizaciion dependiendo roles y codigo sucio
