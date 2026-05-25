import { Usuario } from '../../domain/entities/Usuario';
import { EmailRegistradoException } from '../../domain/exceptions/AuthExceptions'; //si existe un correo
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository'; //para buscar en la bd
import type { RegisterDto } from '../dtos/AuthDtos'; //plantilla de datos

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {} //comunicamos con la bd

  async execute(dto: RegisterDto): Promise<Usuario> {
    const exists = await this.authRepository.findByEmail(dto.email);
    if (exists) {
      throw new EmailRegistradoException();
    }

    const newUser = new Usuario('', dto.name, dto.ci, dto.email, dto.phone);

    return this.authRepository.save(newUser, dto.password);
  }
}
//si no hay nadie se puede registrar, habrian correos repetidos, codigo desorganizado
