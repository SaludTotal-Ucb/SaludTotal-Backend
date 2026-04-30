import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase';
import { RegisterUseCase } from './application/use-cases/RegisterUseCase';
import { I_AUTH_REPOSITORY } from './domain/repositories/IAuthRepository';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { SupabaseAuthRepository } from './infrastructure/persistence/SupabaseAuthRepository';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [
    {
      provide: I_AUTH_REPOSITORY,
      useClass: SupabaseAuthRepository,
    },
    {
      provide: LoginUseCase,
      useFactory: (authRepo) => new LoginUseCase(authRepo),
      inject: [I_AUTH_REPOSITORY],
    },
    {
      provide: RegisterUseCase,
      useFactory: (authRepo) => new RegisterUseCase(authRepo),
      inject: [I_AUTH_REPOSITORY],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (authRepo, configService) =>
        new RefreshTokenUseCase(authRepo, configService),
      inject: [I_AUTH_REPOSITORY, ConfigService],
    },
    {
      provide: LogoutUseCase,
      useFactory: (authRepo) => new LogoutUseCase(authRepo),
      inject: [I_AUTH_REPOSITORY],
    },
  ],
  exports: [I_AUTH_REPOSITORY],
})
export class AuthModule {}
