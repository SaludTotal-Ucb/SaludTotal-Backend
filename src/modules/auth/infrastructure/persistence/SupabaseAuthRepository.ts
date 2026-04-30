import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rol_usuario } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Usuario } from '../../domain/entities/Usuario';
import { CredencialesInvalidasException } from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { JwtPayload } from '../http/middlewares/jwt-auth.guard';

@Injectable()
export class SupabaseAuthRepository implements IAuthRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    const user = await this.prisma.usuarios.findUnique({
      where: { email },
    });

    return user ? this.toDomain(user) : null;
  }

  async findById(id: string): Promise<Usuario | null> {
    const user = await this.prisma.usuarios.findUnique({
      where: { id },
    });

    return user ? this.toDomain(user) : null;
  }

  async save(
    usuario: Omit<Usuario, 'id'>,
    passwordPlain: string,
  ): Promise<Usuario> {
    const id = randomUUID();
    const hash = await bcryptjs.hash(passwordPlain, 10);

    const saved = await this.prisma.usuarios.create({
      data: {
        id,
        name: usuario.name,
        ci: usuario.ci,
        email: usuario.email,
        phone: usuario.phone ?? null,
        password: hash,
        rol: this.toPrismaRole(usuario.roles),
      },
    });

    return this.toDomain(saved);
  }

  async verifyCredentials(
    email: string,
    passwordPlain: string,
  ): Promise<{ user: Usuario; accessToken: string; refreshToken: string }> {
    const userRecord = await this.prisma.usuarios.findUnique({
      where: { email },
    });

    if (!userRecord) {
      throw new CredencialesInvalidasException();
    }

    const isValid = await bcryptjs.compare(passwordPlain, userRecord.password);
    if (!isValid) {
      throw new CredencialesInvalidasException();
    }

    const user = this.toDomain(userRecord);
    const secret =
      this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'default_refresh_secret';
    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '15m') as SignOptions['expiresIn'];
    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) ?? '7d') as SignOptions['expiresIn'];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = jwt.sign(payload, secret, { expiresIn });
    const refreshPayload = { sub: user.id };
    const refreshToken = jwt.sign(refreshPayload, refreshSecret, {
      expiresIn: refreshExpiresIn,
    });

    // Store refresh token in database
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refresh_token.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: expirationDate,
      },
    });

    return { user, accessToken, refreshToken };
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.refresh_token.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async findRefreshToken(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const refreshToken = await this.prisma.refresh_token.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    });

    return refreshToken;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.prisma.refresh_token.deleteMany({
      where: { token },
    });
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refresh_token.deleteMany({
      where: { userId },
    });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.deleteRefreshToken(refreshToken);
  }

  async generatePasswordResetToken(_email: string): Promise<void> {
    // Password reset functionality available in future releases
  }

  async generateToken(user: Usuario): Promise<string> {
    const secret =
      this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '7d') as SignOptions['expiresIn'];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return jwt.sign(payload, secret, { expiresIn });
  }

  private toDomain(user: {
    id: string;
    name: string;
    ci: string;
    email: string;
    phone: string | null;
    password: string;
    rol: rol_usuario;
    created_at: Date | null;
  }): Usuario {
    return new Usuario(
      user.id,
      user.name,
      user.ci,
      user.email,
      user.phone ?? undefined,
      undefined,
      [user.rol],
      user.created_at ?? undefined,
    );
  }

  private toPrismaRole(roles: string[] | undefined): rol_usuario {
    const role = roles?.[0]?.toLowerCase();

    switch (role) {
      case 'medico':
        return rol_usuario.medico;
      case 'admin':
        return rol_usuario.admin;
      default:
        return rol_usuario.paciente;
    }
  }
}
