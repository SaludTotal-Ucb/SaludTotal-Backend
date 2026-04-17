import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
  LoginSchema,
  RecoverPasswordSchema,
  RegisterSchema,
} from '../schemas/auth.schema';
import * as AuthService from '../services/auth.service';

type ZodIssue = z.ZodIssue;

export const login = async (req: Request, res: Response) => {
  try {
    const validation = LoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errors: validation.error.issues.map((e: ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email, password } = validation.data;
    const authData = await AuthService.validateUserCredentials(email, password);

    return res.status(200).json({
      success: true,
      message: 'Bienvenido al sistema Salud Total',
      data: authData,
    });
  } catch (error: unknown) {
    let statusCode = 401;
    let message = 'Credenciales incorrectas';

    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        statusCode = 404;
        message = 'El usuario no está registrado';
      } else if (error.message === 'INVALID_PASSWORD') {
        statusCode = 401;
        message = 'Contraseña incorrecta';
      }
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const validation = RegisterSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errors: validation.error.issues.map((e: ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { name, email, password, phone } = validation.data;
    const newUser = await AuthService.registerUser(
      name,
      email,
      password,
      phone,
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: newUser,
    });
  } catch (error: unknown) {
    let statusCode = 500;
    let message = 'Error al registrar usuario';

    if (error instanceof Error) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        statusCode = 409;
        message = 'El email ya está registrado';
      } else if (error.message === 'INVALID_EMAIL') {
        statusCode = 400;
        message = 'Email inválido';
      }
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    await AuthService.logout();
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente',
      data: {},
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
    });
  }
};

export const recoverPassword = async (req: Request, res: Response) => {
  try {
    const validation = RecoverPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validación fallida',
        errors: validation.error.issues.map((e: ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email } = validation.data;
    await AuthService.recoverPassword(email);

    return res.status(200).json({
      success: true,
      message: 'Instrucciones para recuperar contraseña enviadas al email',
      data: { email },
    });
  } catch (error: unknown) {
    let statusCode = 500;
    let message = 'Error al recuperar contraseña';

    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      statusCode = 404;
      message = 'El usuario no está registrado';
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    const profile = await AuthService.getProfile(userId);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
    });
  }
};
