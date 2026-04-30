import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import type { LoginUseCase } from '../../../application/use-cases/LoginUseCase';
import type { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase';
import type { RefreshTokenUseCase } from '../../../application/use-cases/RefreshTokenUseCase';
import type { RegisterUseCase } from '../../../application/use-cases/RegisterUseCase';
import { AuthException } from '../../../domain/exceptions/AuthExceptions';
import type { HttpLoginDto, HttpRegisterDto } from '../dtos/auth.dto';

interface RefreshTokenDto {
  refreshToken: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: HttpLoginDto) {
    try {
      const data = await this.loginUseCase.execute(body);
      return { success: true, message: 'Bienvenido', data };
    } catch (error: unknown) {
      if (error instanceof AuthException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: HttpRegisterDto) {
    try {
      const data = await this.registerUseCase.execute({
        name: body.name,
        ci: body.ci,
        email: body.email,
        password: body.password,
        phone: body.phone,
      });

      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        data,
      };
    } catch (error: unknown) {
      if (error instanceof AuthException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto) {
    try {
      const data = await this.refreshTokenUseCase.execute(body.refreshToken);
      return {
        success: true,
        message: 'Token renovado exitosamente',
        data,
      };
    } catch (error: unknown) {
      if (error instanceof AuthException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: RefreshTokenDto) {
    try {
      await this.logoutUseCase.execute(body.refreshToken);
      return;
    } catch (error: unknown) {
      if (error instanceof AuthException) {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        { success: false, message: 'Error interno del servidor' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
