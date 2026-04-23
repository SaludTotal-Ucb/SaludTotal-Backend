import { Injectable } from '@nestjs/common';
import type { HistorialMedico } from '../../domain/entities/HistorialMedico';
import type { IHistorialRepository } from '../../domain/repositories/IHistorialRepository';

@Injectable()
export class SupabaseHistorialRepository implements IHistorialRepository {
  async findByPacienteId(_pacienteId: string): Promise<HistorialMedico | null> {
    return null;
  }

  async save(historial: HistorialMedico): Promise<HistorialMedico> {
    return historial;
  }

  async update(historial: HistorialMedico): Promise<HistorialMedico> {
    return historial;
  }
}
