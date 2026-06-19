import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AgendarCitaUseCase } from './application/use-cases/AgendarCitaUseCase';
import { CancelarCitaUseCase } from './application/use-cases/CancelarCitaUseCase';
import { CompletarCitaUseCase } from './application/use-cases/CompletarCitaUseCase';
import { ConfirmarCitaUseCase } from './application/use-cases/ConfirmarCitaUseCase';
import { ObtenerCitasMedicoUseCase } from './application/use-cases/ObtenerCitasMedicoUseCase';
import { ObtenerCitasPacienteUseCase } from './application/use-cases/ObtenerCitasPacienteUseCase';
import { I_CITA_REPOSITORY } from './domain/repositories/ICitaRepository';
import { CitasController } from './infrastructure/http/controllers/citas.controller';
import { SupabaseCitaRepository } from './infrastructure/persistence/SupabaseCitaRepository';
//conecta todo, inyecta dependencias, prisma, auth,
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [CitasController],
  providers: [
    SupabaseCitaRepository,
    { provide: I_CITA_REPOSITORY, useClass: SupabaseCitaRepository },
    {
      provide: AgendarCitaUseCase,
      useFactory: (repo) => new AgendarCitaUseCase(repo),
      inject: [I_CITA_REPOSITORY],
    },
    {
      provide: CancelarCitaUseCase,
      useFactory: (repo) => new CancelarCitaUseCase(repo),
      inject: [I_CITA_REPOSITORY],
    },
    {
      provide: ObtenerCitasPacienteUseCase,
      useFactory: (repo) => new ObtenerCitasPacienteUseCase(repo),
      inject: [I_CITA_REPOSITORY],
    },
    {
      provide: ObtenerCitasMedicoUseCase,
      useFactory: (repo) => new ObtenerCitasMedicoUseCase(repo),
      inject: [I_CITA_REPOSITORY],
    },
    {
      provide: ConfirmarCitaUseCase,
      useFactory: (repo) => new ConfirmarCitaUseCase(repo),
      inject: [I_CITA_REPOSITORY],
    },
    CompletarCitaUseCase,
  ],
})
export class CitasModule {}
