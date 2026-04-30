import { CredencialesInvalidasException } from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LogoutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new CredencialesInvalidasException();
    }

    // Invalidate the refresh token by deleting it from database
    await this.authRepository.logout(refreshToken);
  }
}
