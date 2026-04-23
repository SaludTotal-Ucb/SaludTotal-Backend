import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
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
  ],
  exports: [I_AUTH_REPOSITORY],
})
export class AuthModule {}
