export enum CitaEstado {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ABSENT = 'absent',
}

export type Cita = {
  id: string;
  paciente_id: string;
  medico_id: string;
  clinica_id: string;
  especialidad: string;
  fecha: string;
  hora: string;
  motivo?: string;
  estado: CitaEstado;
  notas_doctor?: string;
  created_at: string;
  updated_at: string;
};
