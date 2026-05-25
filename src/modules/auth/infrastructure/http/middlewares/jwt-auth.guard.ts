import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
//buena practica, revisa si el token es valido para poder entrar a las rutas protegidas
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request); //busca el token valido

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado',
      );
    }

    try {
      const secret = //verifica la autenticidad del token
        this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
      const decoded = jwt.verify(token, secret) as JwtPayload;
      //devuelve los datos del usuario que esten en el token
      request.user = {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles,
      };

      return true; //deja pasar
    } catch (error: unknown) {
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? (error as { name?: unknown }).name
          : undefined;

      if (errorName === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'El token ha expirado. Por favor, inicie sesión nuevamente.', //control de fallos de token
        );
      }
      if (errorName === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido o mal formado.');
      }
      throw new UnauthorizedException('Fallo la autenticación.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    //extraer el token
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

//si no hay seria 0 seguridad, el back se cerraria, codigo inseguro y duplicado en cada archivo para implementar sistemas de seguridad
