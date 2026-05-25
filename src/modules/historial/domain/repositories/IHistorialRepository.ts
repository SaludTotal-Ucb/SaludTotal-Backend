import type { HistorialMedico } from '../entities/HistorialMedico';

export const I_HISTORIAL_REPOSITORY = Symbol('IHistorialRepository');
//contato con la bd
export interface IHistorialRepository {
  findByPacienteId(pacienteId: string): Promise<HistorialMedico | null>;
  save(historial: HistorialMedico): Promise<HistorialMedico>;
  update(historial: HistorialMedico): Promise<HistorialMedico>;
}
