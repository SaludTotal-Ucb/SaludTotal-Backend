import type { Usuario } from '../../domain/entities/Usuario';
import {
  CredencialesInvalidasException,
  UsuarioNoEncontradoException,
} from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { LoginDto } from '../dtos/AuthDtos';
//no sabe nada de prisma ni de supabase, tampoco si la contrasenia esta con bcrypt, solo sabe que tiene que hacer estas acciones
export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(
    dto: LoginDto,
  ): Promise<{ user: Usuario; accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new UsuarioNoEncontradoException();
    }

    try {
      const result = await this.authRepository.verifyCredentials(
        dto.email,
        dto.password, //nos devuelve un access token y un refresh token
      );
      return result;
    } catch {
      throw new CredencialesInvalidasException();
    }
  }
}
