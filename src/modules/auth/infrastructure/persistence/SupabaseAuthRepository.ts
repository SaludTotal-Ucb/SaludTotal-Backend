import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { Usuario } from '../../domain/entities/Usuario';
import { CredencialesInvalidasException } from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { JwtPayload } from '../http/middlewares/jwt-auth.guard';

// MEMORY DB
// Esto reemplaza al mock quemado de antes. Hasta que conectes el cliente de Supabase,
// esto permite registrar, guardar hashes y loguear de forma plenamente funcional y real en RAM.
const mockUsersDb = new Map<string, Usuario>();
const mockCredentialsDb = new Map<string, string>(); // Almacenará el Password Hash

@Injectable()
export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly configService: ConfigService) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    for (const user of mockUsersDb.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<Usuario | null> {
    return mockUsersDb.get(id) || null;
  }

  async save(
    usuario: Omit<Usuario, 'id'>,
    passwordPlain: string,
  ): Promise<Usuario> {
    const id = randomUUID();
    const newUser = new Usuario(
      id,
      usuario.name,
      usuario.email,
      usuario.phone,
      undefined,
      usuario.roles || ['PACIENTE'],
      new Date(),
    );

    // Buenas Prácticas: Siempre hashear contraseñas antes de persistir
    const saltRounds = 10;
    const hash = await bcryptjs.hash(passwordPlain, saltRounds);

    mockUsersDb.set(id, newUser);
    mockCredentialsDb.set(id, hash);
    return newUser;
  }

  async verifyCredentials(
    email: string,
    passwordPlain: string,
  ): Promise<{ user: Usuario; token: string }> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new CredencialesInvalidasException();
    }

    const hash = mockCredentialsDb.get(user.id);
    if (!hash) {
      throw new CredencialesInvalidasException();
    }

    // Validación real contra bcrypt
    const isValid = await bcryptjs.compare(passwordPlain, hash);
    if (!isValid) {
      throw new CredencialesInvalidasException();
    }

    const secret =
      this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '7d') as SignOptions['expiresIn'];

    // Construcción de Payload basado en estándares JWT (Estándar RFC 7519)
    const payload: JwtPayload = {
      sub: user.id, // Subject: Quién es (El ID)
      email: user.email, // Custom claim para email
      roles: user.roles, // Custom claim de roles, aquí se expanden a arrays
    };

    const token = jwt.sign(payload, secret, { expiresIn });
    return { user, token };
  }

  async logout(): Promise<void> {
    // Cuando migres a Supabase Real, llamar a: supabase.auth.signOut()
  }

  async generatePasswordResetToken(_email: string): Promise<void> {
    // Cuando migres a Supabase Real, llamar a: supabase.auth.resetPasswordForEmail()
  }

  // IMPORTANTE para IAuthRepository:
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
}
