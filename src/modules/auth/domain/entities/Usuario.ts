export class Usuario {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly password?: string, // optional for responses
    public readonly roles: string[] = ['PACIENTE'],
    public readonly createdAt?: Date,
  ) {}
}
