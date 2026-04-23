import { Module } from '@nestjs/common';
import { CrearHistorialUseCase } from './application/use-cases/CrearHistorialUseCase';
import { ObtenerHistorialPorPacienteUseCase } from './application/use-cases/ObtenerHistorialPorPacienteUseCase';
import { I_HISTORIAL_REPOSITORY } from './domain/repositories/IHistorialRepository';
import { HistorialController } from './infrastructure/http/controllers/historial.controller';
import { SupabaseHistorialRepository } from './infrastructure/persistence/SupabaseHistorialRepository';

@Module({
  controllers: [HistorialController],
  providers: [
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
