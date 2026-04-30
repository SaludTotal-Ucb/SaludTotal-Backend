import type { Usuario } from '../entities/Usuario';

export const I_AUTH_REPOSITORY = Symbol('IAuthRepository');

export interface IAuthRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  save(usuario: Omit<Usuario, 'id'>, passwordPlain: string): Promise<Usuario>;
  verifyCredentials(
    email: string,
    passwordPlain: string,
  ): Promise<{ user: Usuario; accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
  generatePasswordResetToken(email: string): Promise<void>;
  generateToken?(user: Usuario): Promise<string>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  findRefreshToken(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteAllRefreshTokens(userId: string): Promise<void>;
}
