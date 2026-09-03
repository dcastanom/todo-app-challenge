import type { ActualizarCategoriaInput, CategoriaDTO, CrearCategoriaInput } from '@todo/shared';
import { categoriasApi } from '../services/categorias.service.js';
import { useCrudColeccion, type CrudColeccion } from './useCrudColeccion.js';

export type UseCategorias = CrudColeccion<
  CategoriaDTO,
  CrearCategoriaInput,
  ActualizarCategoriaInput
>;

export function useCategorias(onChange?: () => void): UseCategorias {
  return useCrudColeccion(categoriasApi, onChange);
}
