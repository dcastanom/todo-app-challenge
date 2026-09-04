import type { FormatoExport, TareaDTO } from '@todo/shared';
import { toCsv, type CsvColumn } from '../../lib/csv.js';

const COLUMNS: CsvColumn<TareaDTO>[] = [
  { header: 'id', value: (t) => t.id },
  { header: 'titulo', value: (t) => t.titulo },
  { header: 'descripcion', value: (t) => t.descripcion ?? '' },
  { header: 'prioridad', value: (t) => t.prioridad },
  { header: 'completada', value: (t) => (t.completada ? 'si' : 'no') },
  { header: 'categoria', value: (t) => t.categoria?.nombre ?? '' },
  { header: 'etiquetas', value: (t) => t.etiquetas.map((e) => e.nombre).join(' | ') },
  { header: 'fecha_vencimiento', value: (t) => t.fechaVencimiento ?? '' },
  { header: 'completada_en', value: (t) => t.completadaEn ?? '' },
  { header: 'creada_en', value: (t) => t.createdAt },
];

export interface ExportPayload {
  body: string;
  contentType: string;
  filename: string;
}

/** Serialises tasks to the requested download format. */
export function serializeExport(tareas: TareaDTO[], formato: FormatoExport): ExportPayload {
  const stamp = new Date().toISOString().slice(0, 10);
  if (formato === 'json') {
    return {
      body: JSON.stringify(
        { exportadoEn: new Date().toISOString(), total: tareas.length, tareas },
        null,
        2,
      ),
      contentType: 'application/json; charset=utf-8',
      filename: `tareas-${stamp}.json`,
    };
  }
  return {
    body: toCsv(tareas, COLUMNS),
    contentType: 'text/csv; charset=utf-8',
    filename: `tareas-${stamp}.csv`,
  };
}
