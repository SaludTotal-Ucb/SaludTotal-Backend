export class CitaException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CitaNoEncontradaException extends CitaException {
  constructor() {
    super('Cita no encontrada');
  }
}

export class PacientePenalizadoException extends CitaException {
  constructor() {
    super('No puede agendar citas debido a una penalización vigente');
  }
}

export class HorarioOcupadoException extends CitaException {
  constructor() {
    super('El doctor ya tiene una cita en ese horario');
  }
}
