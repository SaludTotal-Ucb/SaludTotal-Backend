import type { Usuario } from '../entities/Usuario';

export const I_AUTH_REPOSITORY = Symbol('IAuthRepository');

export interface IAuthRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  save(usuario: Omit<Usuario, 'id'>, passwordPlain: string): Promise<Usuario>;
  verifyCredentials(
    email: string,
    passwordPlain: string,
  ): Promise<{ user: Usuario; token: string }>;
  logout(): Promise<void>;
  generatePasswordResetToken(email: string): Promise<void>;
  generateToken?(user: Usuario): Promise<string>;
}
