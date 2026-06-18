import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { LoginUseCase } from '../../../application/use-cases/LoginUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { RefreshTokenUseCase } from '../../../application/use-cases/RefreshTokenUseCase';
// biome-ignore lint/style/useImportType: NestJS DI reflection
import { RegisterUseCase } from '../../../application/use-cases/RegisterUseCase';
import { AuthException } from '../../../domain/exceptions/AuthExceptions';
import { HttpLoginDto, HttpRegisterDto } from '../dtos/auth.dto';

class HttpRefreshTokenDto {
  refreshToken: string;
}

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiBody({ type: HttpLoginDto })
  @ApiResponse({
    status: 200,
    description:
      'Sesión iniciada con éxito. Retorna accessToken y refreshToken.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas (Unauthorized).',
  })
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
  @ApiOperation({ summary: 'Registrar un nuevo Paciente' })
  @ApiBody({ type: HttpRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Paciente registrado exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos del formulario inválidos.' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: el correo electrónico o CI ya están registrados.',
  })
  async register(@Body() body: HttpRegisterDto) {
    try {
      const data = await this.registerUseCase.execute({
        name: body.name,
        ci: body.ci,
        email: body.email,
        password: body.password,
        phone: body.phone,
        birthDate: body.birthDate,
        gender: body.gender,
        bloodType: body.bloodType,
        address: body.address,
        emergencyContact: body.emergencyContact,
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
  @ApiOperation({
    summary: 'Renovar el accessToken expirado usando un refreshToken válido',
  })
  @ApiBody({ type: HttpRefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token renovado con éxito.' })
  @ApiResponse({
    status: 401,
    description: 'El refresh token ha expirado o es inválido.',
  })
  async refresh(@Body() body: HttpRefreshTokenDto) {
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
  @ApiOperation({ summary: 'Cerrar sesión e invalidar el refreshToken' })
  @ApiBody({ type: HttpRefreshTokenDto })
  @ApiResponse({ status: 204, description: 'Sesión cerrada con éxito.' })
  @ApiResponse({
    status: 401,
    description: 'El refresh token es inválido o no existe.',
  })
  async logout(@Body() body: HttpRefreshTokenDto) {
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
