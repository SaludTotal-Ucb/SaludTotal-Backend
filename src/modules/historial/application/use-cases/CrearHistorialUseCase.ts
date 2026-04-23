import {
  EnfoqueAfeccion,
  HistorialMedico,
} from '../../domain/entities/HistorialMedico';
import type { IHistorialRepository } from '../../domain/repositories/IHistorialRepository';
import type { CrearHistorialDto } from '../dtos/HistorialDtos';

export class CrearHistorialUseCase {
  constructor(private readonly repo: IHistorialRepository) {}

  async execute(dto: CrearHistorialDto): Promise<HistorialMedico> {
    const afecciones = dto.afecciones.map(
      (a) => new EnfoqueAfeccion(a.problema, a.severidad, a.diagnostico),
    );

    const historial = new HistorialMedico(
      '',
      dto.pacienteId,
      dto.tipoSangre,
      dto.alergias,
      dto.tratamientosEnCurso,
      afecciones,
    );

    return await this.repo.save(historial);
  }
}
