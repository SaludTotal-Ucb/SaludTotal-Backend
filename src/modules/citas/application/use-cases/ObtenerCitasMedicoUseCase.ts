import type { Cita } from '../../domain/entities/Cita';
import type { ICitaRepository } from '../../domain/repositories/ICitaRepository';

export class ObtenerCitasMedicoUseCase {
  constructor(private readonly repository: ICitaRepository) {}

  async execute(medicoId: string): Promise<Cita[]> {
    return await this.repository.findByMedicoId(medicoId);
  }
}
