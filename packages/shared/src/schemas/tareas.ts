import { z } from 'zod';
import { CAMPOS_ORDEN, DIRECCIONES_ORDEN, PRIORIDADES } from '../constants.js';
import { paginationQuerySchema } from './common.js';

/** Accepts an ISO string or `null`; empty string → null. */
const fechaOpcional = z
  .string()
  .datetime({ offset: true })
  .or(z.literal(''))
  .nullish()
  .transform((v) => (v ? v : null));

export const crearTareaSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(255),
  descripcion: z
    .string()
    .trim()
    .max(5000)
    .nullish()
    .transform((v) => v ?? null),
  prioridad: z.enum(PRIORIDADES).default('normal'),
  fechaVencimiento: fechaOpcional,
  categoriaId: z
    .string()
    .uuid()
    .nullish()
    .transform((v) => v ?? null),
  etiquetaIds: z.array(z.string().uuid()).max(20).optional(),
});

export const actualizarTareaSchema = crearTareaSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envía al menos un campo para actualizar',
  });

export const completarTareaSchema = z.object({
  completada: z.boolean(),
});

/** Query string `"true"` / `"false"` → boolean. */
const boolParam = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

/** Comma-separated list → trimmed non-empty string[]. */
const csvParam = z
  .string()
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().min(1)).min(1))
  .optional();

export const listarTareasQuerySchema = paginationQuerySchema.extend({
  orden: z.enum(CAMPOS_ORDEN).default('created_at'),
  direccion: z.enum(DIRECCIONES_ORDEN).default('desc'),
  // Filters (all optional)
  completada: boolParam,
  prioridad: z.enum(PRIORIDADES).optional(),
  categoria: z.string().uuid().optional(),
  sinCategoria: boolParam,
  etiquetas: csvParam,
  fechaDesde: z.string().datetime({ offset: true }).optional(),
  fechaHasta: z.string().datetime({ offset: true }).optional(),
  vencidas: boolParam,
  busqueda: z.string().trim().min(1).max(120).optional(),
});

export type CrearTareaInput = z.infer<typeof crearTareaSchema>;
export type ActualizarTareaInput = z.infer<typeof actualizarTareaSchema>;
export type CompletarTareaInput = z.infer<typeof completarTareaSchema>;
export type ListarTareasQuery = z.infer<typeof listarTareasQuerySchema>;
/** The filter-only slice, used by the frontend FilterPanel/useFilters. */
export type TareaFiltros = Omit<ListarTareasQuery, 'page' | 'limit' | 'orden' | 'direccion'>;
