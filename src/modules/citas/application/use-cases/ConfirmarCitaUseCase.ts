import type { Cita } from '../../domain/entities/Cita';
import { CitaNoEncontradaException } from '../../domain/exceptions/CitaExceptions';
import type { ICitaRepository } from '../../domain/repositories/ICitaRepository';

export interface ConfirmarCitaDto {
  citaId: string;
  medicoId: string;
}

export class ConfirmarCitaUseCase {
  constructor(private readonly repository: ICitaRepository) {}

  async execute(dto: ConfirmarCitaDto): Promise<Cita> {
    const cita = await this.repository.findById(dto.citaId);

    if (!cita || cita.doctorId !== dto.medicoId) {
      throw new CitaNoEncontradaException();
    }

    const citaConfirmada = cita.confirmar();

    return await this.repository.save(citaConfirmada);
  }
}
