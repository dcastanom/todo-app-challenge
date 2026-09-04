import {
  REALTIME_EVENTS,
  type ActualizarEtiquetaInput,
  type CrearEtiquetaInput,
  type EtiquetaDTO,
} from '@todo/shared';
import { etiquetasApi } from '../services/etiquetas.service.js';
import { useCrudColeccion, type CrudColeccion } from './useCrudColeccion.js';

export type UseEtiquetas = CrudColeccion<EtiquetaDTO, CrearEtiquetaInput, ActualizarEtiquetaInput>;

export function useEtiquetas(onChange?: () => void): UseEtiquetas {
  return useCrudColeccion(etiquetasApi, onChange, REALTIME_EVENTS.ETIQUETAS_CAMBIARON);
}
