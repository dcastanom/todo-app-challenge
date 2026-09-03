import type { Prioridad } from '../constants.js';

/** A task as returned by the API (dates are ISO strings). */
export interface TareaDTO {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: Prioridad;
  completada: boolean;
  fechaVencimiento: string | null;
  completadaEn: string | null;
  categoriaId: string | null;
  posicion: number;
  createdAt: string;
  updatedAt: string;
}
