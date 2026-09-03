import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido (ej. #3498db)');

const nombreCategoria = z.string().trim().min(1, 'El nombre es obligatorio').max(100);

export const crearCategoriaSchema = z.object({
  nombre: nombreCategoria,
  descripcion: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((v) => v ?? null),
  color: hexColor.default('#3498db'),
});

export const actualizarCategoriaSchema = crearCategoriaSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Envía al menos un campo' });

const nombreEtiqueta = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(50)
  .regex(/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u, 'Sólo letras, números y espacios / _ -');

export const crearEtiquetaSchema = z.object({
  nombre: nombreEtiqueta,
  color: hexColor.default('#95a5a6'),
});

export const actualizarEtiquetaSchema = crearEtiquetaSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Envía al menos un campo' });

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
export type ActualizarCategoriaInput = z.infer<typeof actualizarCategoriaSchema>;
export type CrearEtiquetaInput = z.infer<typeof crearEtiquetaSchema>;
export type ActualizarEtiquetaInput = z.infer<typeof actualizarEtiquetaSchema>;
