import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AgendarCitaUseCase } from './application/use-cases/AgendarCitaUseCase';
import { CancelarCitaUseCase } from './application/use-cases/CancelarCitaUseCase';
import { I_CITA_REPOSITORY } from './domain/repositories/ICitaRepository';
import { CitasController } from './infrastructure/http/controllers/citas.controller';
import { SupabaseCitaRepository } from './infrastructure/persistence/SupabaseCitaRepository';

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
  ],
})
export class CitasModule {}
