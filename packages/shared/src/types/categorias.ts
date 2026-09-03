export interface CategoriaDTO {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  orden: number;
  createdAt: string;
  updatedAt: string;
}

export interface EtiquetaDTO {
  id: string;
  nombre: string;
  color: string;
  createdAt: string;
}

/** Compact shapes embedded in a TareaDTO. */
export type CategoriaResumen = Pick<CategoriaDTO, 'id' | 'nombre' | 'color'>;
export type EtiquetaResumen = Pick<EtiquetaDTO, 'id' | 'nombre' | 'color'>;
