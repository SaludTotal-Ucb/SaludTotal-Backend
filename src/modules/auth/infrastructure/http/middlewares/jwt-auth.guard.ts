import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticación no proporcionado',
      );
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
      const decoded = jwt.verify(token, secret) as JwtPayload;

      request.user = {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles,
      };

      return true;
    } catch (error: unknown) {
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? (error as { name?: unknown }).name
          : undefined;

      if (errorName === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'El token ha expirado. Por favor, inicie sesión nuevamente.',
        );
      }
      if (errorName === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido o mal formado.');
      }
      throw new UnauthorizedException('Fallo la autenticación.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
