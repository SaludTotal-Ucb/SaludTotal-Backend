export interface CrearHistorialDto {
  pacienteId: string;
  tipoSangre: string;
  alergias: string[];
  tratamientosEnCurso: string[];
  afecciones: Array<{
    problema: string;
    severidad: string;
    diagnostico: string;
  }>;
  genero?: string;
  fechaNacimiento?: string;
  direccion?: string;
  contactoEmergencia?: string;
}
