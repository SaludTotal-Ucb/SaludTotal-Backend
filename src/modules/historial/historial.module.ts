import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrearHistorialUseCase } from './application/use-cases/CrearHistorialUseCase';
import { ObtenerHistorialPorPacienteUseCase } from './application/use-cases/ObtenerHistorialPorPacienteUseCase';
import { I_HISTORIAL_REPOSITORY } from './domain/repositories/IHistorialRepository';
import { HistorialController } from './infrastructure/http/controllers/historial.controller';
import { SupabaseHistorialRepository } from './infrastructure/persistence/SupabaseHistorialRepository';

import { PrismaModule } from '../../prisma/prisma.module';
//conecta todo, inyecta dependencias prisma, auth, etc
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [HistorialController],
  providers: [
    SupabaseHistorialRepository,
    { provide: I_HISTORIAL_REPOSITORY, useClass: SupabaseHistorialRepository },
    {
      provide: ObtenerHistorialPorPacienteUseCase,
      useFactory: (repo) => new ObtenerHistorialPorPacienteUseCase(repo),
      inject: [I_HISTORIAL_REPOSITORY],
    },
    {
      provide: CrearHistorialUseCase,
      useFactory: (repo) => new CrearHistorialUseCase(repo),
      inject: [I_HISTORIAL_REPOSITORY],
    },
  ],
})
export class HistorialModule {}
