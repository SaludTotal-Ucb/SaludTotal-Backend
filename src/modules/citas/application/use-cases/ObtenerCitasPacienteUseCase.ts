import type { Cita } from '../../domain/entities/Cita';
import type { ICitaRepository } from '../../domain/repositories/ICitaRepository';

export class ObtenerCitasPacienteUseCase {
  constructor(private readonly repository: ICitaRepository) {}

  async execute(pacienteId: string): Promise<Cita[]> {
    return await this.repository.findByPacienteId(pacienteId);
  }
}
