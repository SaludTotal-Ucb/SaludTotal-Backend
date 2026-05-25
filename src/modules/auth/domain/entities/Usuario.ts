export class Usuario {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ci: string,
    public readonly email: string,
    public readonly phone?: string,
    public readonly password?: string,
    public readonly roles: string[] = ['paciente'],
    public readonly createdAt?: Date,
  ) {}
}
