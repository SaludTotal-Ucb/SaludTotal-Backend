import type { Cita, Penalizacion } from '../entities/Cita';

export const I_CITA_REPOSITORY = Symbol('ICitaRepository');

export interface ICitaRepository {
  findById(id: string): Promise<Cita | null>;
  findByPacienteId(pacienteId: string): Promise<Cita[]>;
  save(cita: Cita): Promise<Cita>;
  getPenalizacionActiva(pacienteId: string): Promise<Penalizacion | null>;
  verificarDisponibilidad(doctorId: string, fecha: Date): Promise<boolean>;
}
