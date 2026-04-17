export enum TipoPenalizacion {
  LATE_CANCELLATION = 'late_cancellation',
  MULTIPLE_ABSENCES = 'multiple_absences',
}

export type Penalizacion = {
  id: string;
  paciente_id: string;
  tipo: TipoPenalizacion;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
};
