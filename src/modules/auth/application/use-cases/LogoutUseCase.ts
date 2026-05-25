import { CredencialesInvalidasException } from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new CredencialesInvalidasException(); //si no hay refresh token, no se puede cerrar sesion
    }

    // Invalida el refresh token eliminadolo de la base de datos
    await this.authRepository.logout(refreshToken);
  }
}
