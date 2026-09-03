import type { Prioridad } from '../constants.js';
import type { CategoriaResumen, EtiquetaResumen } from './categorias.js';

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
  categoria: CategoriaResumen | null;
  etiquetas: EtiquetaResumen[];
  posicion: number;
  createdAt: string;
  updatedAt: string;
}
