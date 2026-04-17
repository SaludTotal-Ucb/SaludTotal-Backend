import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Formato de email inválido'),
  phone: z
    .string()
    .regex(
      /^\+?[0-9\s-()]*$/,
      'El teléfono solo puede contener números, +, espacios, guiones y paréntesis',
    )
    .regex(/[0-9]{7,}/, 'El teléfono debe contener al menos 7 dígitos')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      'Debe contener al menos un carácter especial',
    ),
});

export const RecoverPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});
