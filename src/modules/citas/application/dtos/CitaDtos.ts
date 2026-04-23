export interface CrearCitaDto {
  pacienteId: string;
  doctorId: string;
  fecha: Date;
  especialidad: string;
  notas?: string;
}

export interface CancelarCitaDto {
  citaId: string;
  pacienteId: string;
}
