import { Cita } from '../../domain/entities/Cita';
import {
  FechaPasadaException,
  HorarioOcupadoException,
  PacientePenalizadoException,
} from '../../domain/exceptions/CitaExceptions';
import type { ICitaRepository } from '../../domain/repositories/ICitaRepository';
import type { CrearCitaDto } from '../dtos/CitaDtos';
//logica del negocio
export class AgendarCitaUseCase {
  constructor(private readonly repository: ICitaRepository) {}

  async execute(dto: CrearCitaDto): Promise<Cita> {
    if (dto.fecha < new Date()) {
      throw new FechaPasadaException();
    }

    const penalizacionActiva = await this.repository.getPenalizacionActiva(
      dto.pacienteId,
    );
    if (penalizacionActiva?.estaVigente()) {
      throw new PacientePenalizadoException();
    }

    const disponible = await this.repository.verificarDisponibilidad(
      dto.doctorId,
      dto.fecha,
    );
    if (!disponible) {
      throw new HorarioOcupadoException();
    }

    const nuevaCita = new Cita(
      '',
      dto.pacienteId,
      dto.doctorId,
      dto.fecha,
      dto.especialidad,
      'PENDIENTE',
      dto.notas,
    );

    return await this.repository.save(nuevaCita);
  }
}
