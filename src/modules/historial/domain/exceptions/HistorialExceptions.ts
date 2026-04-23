export class HistorialException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class HistorialNoEncontradoException extends HistorialException {
  constructor() {
    super('No se encontró el historial médico del paciente');
  }
}
