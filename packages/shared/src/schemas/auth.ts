import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email().max(255);

/** At least 8 chars, one letter and one digit. */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128)
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
  .regex(/\d/, 'Debe incluir al menos un número');

export const registerSchema = z.object({
  email: emailSchema,
  username: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(100)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Sólo letras, números y . _ -'),
  password: passwordSchema,
  nombreCompleto: z.string().trim().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Requerida'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
