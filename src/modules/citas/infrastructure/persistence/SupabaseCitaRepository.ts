import { Injectable } from '@nestjs/common';
import type { Cita, Penalizacion } from '../../domain/entities/Cita';
import type { ICitaRepository } from '../../domain/repositories/ICitaRepository';

@Injectable()
export class SupabaseCitaRepository implements ICitaRepository {
  async findById(_id: string): Promise<Cita | null> {
    return null;
  }
  async findByPacienteId(_pacienteId: string): Promise<Cita[]> {
    return [];
  }
  async save(cita: Cita): Promise<Cita> {
    return cita;
  }
  async getPenalizacionActiva(
    _pacienteId: string,
  ): Promise<Penalizacion | null> {
    return null;
  }
  async verificarDisponibilidad(
    _doctorId: string,
    _fecha: Date,
  ): Promise<boolean> {
    return true;
  }
}
