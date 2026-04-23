export type EstadoCita =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'COMPLETADA';

export class Cita {
  constructor(
    public readonly id: string,
    public readonly pacienteId: string,
    public readonly doctorId: string,
    public readonly fecha: Date,
    public readonly especialidad: string,
    public readonly estado: EstadoCita = 'PENDIENTE',
    public readonly notas?: string,
  ) {}

  cancelar(): Cita {
    if (this.estado === 'COMPLETADA') {
      throw new Error('No se puede cancelar una cita completada');
    }
    return new Cita(
      this.id,
      this.pacienteId,
      this.doctorId,
      this.fecha,
      this.especialidad,
      'CANCELADA',
      this.notas,
    );
  }
}

export class Penalizacion {
  constructor(
    public readonly id: string,
    public readonly pacienteId: string,
    public readonly motivo: string,
    public readonly fechaFin: Date,
  ) {}

  estaVigente(): boolean {
    return new Date() < this.fechaFin;
  }
}
