export class EnfoqueAfeccion {
  constructor(
    public readonly problema: string,
    public readonly severidad: string,
    public readonly diagnostico: string,
  ) {}
}

export class HistorialMedico {
  constructor(
    public readonly id: string,
    public readonly pacienteId: string,
    public readonly tipoSangre: string,
    public readonly alergias: string[],
    public readonly tratamientosEnCurso: string[],
    public readonly afecciones: EnfoqueAfeccion[],
  ) {}
}
