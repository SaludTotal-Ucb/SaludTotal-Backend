import type { Cita } from '../../domain/entities/Cita';
import { CitaNoEncontradaException } from '../../domain/exceptions/CitaExceptions';
import type { ICitaRepository } from '../../domain/repositories/ICitaRepository';
import type { CancelarCitaDto } from '../dtos/CitaDtos';

export class CancelarCitaUseCase {
  constructor(private readonly repository: ICitaRepository) {}

  async execute(dto: CancelarCitaDto): Promise<Cita> {
    const cita = await this.repository.findById(dto.citaId);

    if (!cita || cita.pacienteId !== dto.pacienteId) {
      throw new CitaNoEncontradaException();
    }

    const citaCancelada = cita.cancelar();

    // Al cancelar más tarde debería gatillar penalización si queda poco tiempo.
    // Lógica de negocio.

    return await this.repository.save(citaCancelada);
  }
}
