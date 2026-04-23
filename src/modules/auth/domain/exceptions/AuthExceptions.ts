export class AuthException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UsuarioNoEncontradoException extends AuthException {
  constructor() {
    super('El usuario no está registrado');
  }
}

export class CredencialesInvalidasException extends AuthException {
  constructor() {
    super('Contraseña incorrecta');
  }
}

export class EmailRegistradoException extends AuthException {
  constructor() {
    super('El email ya está registrado');
  }
}
