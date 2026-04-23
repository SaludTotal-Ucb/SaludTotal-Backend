import type { Usuario } from '../../domain/entities/Usuario';
import {
  CredencialesInvalidasException,
  UsuarioNoEncontradoException,
} from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { LoginDto } from '../dtos/AuthDtos';

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: LoginDto): Promise<{ user: Usuario; token: string }> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UsuarioNoEncontradoException();
    }

    // We assume verifyCredentials handles the implementation detail (like Supabase Auth)
    // and throws if invalid, or returns the token.
    try {
      const result = await this.authRepository.verifyCredentials(
        dto.email,
        dto.password,
      );
      return result;
    } catch {
      throw new CredencialesInvalidasException();
    }
  }
}
