import type { HistorialMedico } from '../../domain/entities/HistorialMedico';
import { HistorialNoEncontradoException } from '../../domain/exceptions/HistorialExceptions';
import type { IHistorialRepository } from '../../domain/repositories/IHistorialRepository';

export class ObtenerHistorialPorPacienteUseCase {
  constructor(private readonly repo: IHistorialRepository) {}

  async execute(pacienteId: string): Promise<HistorialMedico> {
    const historial = await this.repo.findByPacienteId(pacienteId);
    if (!historial) {
      throw new HistorialNoEncontradoException();
    }
    return historial;
  }
}
