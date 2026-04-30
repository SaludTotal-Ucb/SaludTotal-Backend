import type { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { CredencialesInvalidasException } from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class RefreshTokenUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Check if the refresh token exists in the database
    const storedToken =
      await this.authRepository.findRefreshToken(refreshToken);
    if (!storedToken) {
      throw new CredencialesInvalidasException();
    }

    // 2. Check if it's expired
    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.deleteRefreshToken(refreshToken);
      throw new CredencialesInvalidasException();
    }

    try {
      // 3. Verify the JWT signature
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'default_refresh_secret';
      const payload = jwt.verify(refreshToken, refreshSecret) as {
        sub: string;
      };

      // 4. Get user to include current role in new token
      const user = await this.authRepository.findById(payload.sub);
      if (!user) {
        throw new CredencialesInvalidasException();
      }

      // 5. Generate new token pair
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'default_secret_key';
      const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
        '15m') as SignOptions['expiresIn'];
      const newRefreshExpiresIn = (this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) ?? '7d') as SignOptions['expiresIn'];

      const accessPayload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
      };

      const newAccessToken = jwt.sign(accessPayload, secret, { expiresIn });

      const refreshPayload = { sub: user.id };
      const newRefreshToken = jwt.sign(refreshPayload, refreshSecret, {
        expiresIn: newRefreshExpiresIn,
      });

      // 6. Rotate: delete old refresh token, store the new one
      await this.authRepository.deleteRefreshToken(refreshToken);
      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.authRepository.saveRefreshToken(
        user.id,
        newRefreshToken,
        expirationDate,
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (err instanceof CredencialesInvalidasException) {
        throw err;
      }
      throw new CredencialesInvalidasException();
    }
  }
}
