import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Usuario } from '../../domain/entities/Usuario';
import {
  CredencialesInvalidasException,
  EmailRegistradoException,
  UsuarioNoEncontradoException,
} from '../../domain/exceptions/AuthExceptions';
import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { LoginUseCase } from './LoginUseCase';
import { LogoutUseCase } from './LogoutUseCase';
import { RegisterUseCase } from './RegisterUseCase';

describe('Auth Use Cases', () => {
  // biome-ignore lint/suspicious/noExplicitAny: mock repository is untyped for testing ease
  let mockAuthRepository: any;

  beforeEach(() => {
    mockAuthRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      verifyCredentials: vi.fn(),
      saveRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
      deleteRefreshToken: vi.fn(),
      deleteAllRefreshTokens: vi.fn(),
      logout: vi.fn(),
      generatePasswordResetToken: vi.fn(),
      generateToken: vi.fn(),
    };
  });

  describe('RegisterUseCase', () => {
    it('should successfully register a new user if email is not taken', async () => {
      const registerUseCase = new RegisterUseCase(mockAuthRepository);
      const dto = {
        name: 'John Doe',
        ci: '1234567',
        email: 'john@example.com',
        password: 'password123',
        phone: '77788899',
      };

      mockAuthRepository.findByEmail.mockResolvedValue(null);
      const createdUser = new Usuario(
        'user-uuid',
        dto.name,
        dto.ci,
        dto.email,
        dto.phone,
        undefined,
        ['paciente'],
      );
      mockAuthRepository.save.mockResolvedValue(createdUser);

      const result = await registerUseCase.execute(dto);

      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockAuthRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Usuario);
      expect(result.email).toBe(dto.email);
      expect(result.roles).toContain('paciente');
    });

    it('should throw EmailRegistradoException if email is already taken', async () => {
      const registerUseCase = new RegisterUseCase(mockAuthRepository);
      const dto = {
        name: 'John Doe',
        ci: '1234567',
        email: 'john@example.com',
        password: 'password123',
        phone: '77788899',
      };

      const existingUser = new Usuario(
        'existing-uuid',
        'Existing User',
        '7654321',
        dto.email,
        undefined,
        undefined,
        ['paciente'],
      );
      mockAuthRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(registerUseCase.execute(dto)).rejects.toThrow(
        EmailRegistradoException,
      );
      expect(mockAuthRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('LoginUseCase', () => {
    it('should successfully login user with valid credentials', async () => {
      const loginUseCase = new LoginUseCase(mockAuthRepository);
      const dto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const user = new Usuario(
        'user-uuid',
        'John Doe',
        '1234567',
        dto.email,
        undefined,
        undefined,
        ['paciente'],
      );
      mockAuthRepository.findByEmail.mockResolvedValue(user);
      mockAuthRepository.verifyCredentials.mockResolvedValue({
        user,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      });

      const result = await loginUseCase.execute(dto);

      expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockAuthRepository.verifyCredentials).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(result.accessToken).toBe('access-token-123');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw UsuarioNoEncontradoException if email does not exist', async () => {
      const loginUseCase = new LoginUseCase(mockAuthRepository);
      const dto = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      mockAuthRepository.findByEmail.mockResolvedValue(null);

      await expect(loginUseCase.execute(dto)).rejects.toThrow(
        UsuarioNoEncontradoException,
      );
      expect(mockAuthRepository.verifyCredentials).not.toHaveBeenCalled();
    });

    it('should throw CredencialesInvalidasException if credentials verification fails', async () => {
      const loginUseCase = new LoginUseCase(mockAuthRepository);
      const dto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const user = new Usuario(
        'user-uuid',
        'John Doe',
        '1234567',
        dto.email,
        undefined,
        undefined,
        ['paciente'],
      );
      mockAuthRepository.findByEmail.mockResolvedValue(user);
      mockAuthRepository.verifyCredentials.mockRejectedValue(
        new CredencialesInvalidasException(),
      );

      await expect(loginUseCase.execute(dto)).rejects.toThrow(
        CredencialesInvalidasException,
      );
    });
  });

  describe('LogoutUseCase', () => {
    it('should successfully call logout on repository', async () => {
      const logoutUseCase = new LogoutUseCase(mockAuthRepository);
      const token = 'refresh-token-val';

      await logoutUseCase.execute(token);

      expect(mockAuthRepository.logout).toHaveBeenCalledWith(token);
    });

    it('should throw CredencialesInvalidasException if token is empty', async () => {
      const logoutUseCase = new LogoutUseCase(mockAuthRepository);

      await expect(logoutUseCase.execute('')).rejects.toThrow(
        CredencialesInvalidasException,
      );
      expect(mockAuthRepository.logout).not.toHaveBeenCalled();
    });
  });
});
