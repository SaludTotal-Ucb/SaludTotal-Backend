import { Usuario } from '../../domain/entities/Usuario';
import { EmailRegistradoException } from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { RegisterDto } from '../dtos/AuthDtos';

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto: RegisterDto): Promise<Usuario> {
    const exists = await this.authRepository.findByEmail(dto.email);
    if (exists) {
      throw new EmailRegistradoException();
    }

    const newUser = new Usuario('', dto.name, dto.ci, dto.email, dto.phone);

    return this.authRepository.save(newUser, dto.password);
  }
}
