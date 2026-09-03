import { PRIORIDADES, type CategoriaDTO, type EtiquetaDTO, type Prioridad } from '@todo/shared';
import type { UseFilters } from '../../hooks/useFilters.js';
import styles from './FilterPanel.module.css';

const PRIORIDAD_LABEL: Record<Prioridad, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

/** `YYYY-MM-DD` (date input) → ISO at the day's start/end, local time. */
function dayIso(value: string, edge: 'start' | 'end'): string | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T${edge === 'start' ? '00:00:00' : '23:59:59'}`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
function isoToDay(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export interface FilterPanelProps {
  filters: UseFilters;
  categorias: CategoriaDTO[];
  etiquetas: EtiquetaDTO[];
}

export function FilterPanel({
  filters,
  categorias,
  etiquetas,
}: FilterPanelProps): React.JSX.Element {
  const { filtros, set, toggleEtiqueta, clear, activos } = filters;

  const estado =
    filtros.completada === true
      ? 'completadas'
      : filtros.completada === false
        ? 'pendientes'
        : 'todas';

  const categoriaValue = filtros.sinCategoria ? 'ninguna' : (filtros.categoria ?? 'todas');
  const onCategoria = (v: string): void => {
    if (v === 'todas') {
      set('categoria', undefined);
      set('sinCategoria', undefined);
    } else if (v === 'ninguna') {
      set('categoria', undefined);
      set('sinCategoria', true);
    } else {
      set('sinCategoria', undefined);
      set('categoria', v);
    }
  };

  return (
    <div className={styles.panel} aria-label="Filtros">
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Estado</span>
          <select
            value={estado}
            onChange={(e) =>
              set(
                'completada',
                e.target.value === 'todas' ? undefined : e.target.value === 'completadas',
              )
            }
          >
            <option value="todas">Todas</option>
            <option value="pendientes">Pendientes</option>
            <option value="completadas">Completadas</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>Prioridad</span>
          <select
            value={filtros.prioridad ?? ''}
            onChange={(e) =>
              set('prioridad', e.target.value ? (e.target.value as Prioridad) : undefined)
            }
          >
            <option value="">Cualquiera</option>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {PRIORIDAD_LABEL[p]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Categoría</span>
          <select value={categoriaValue} onChange={(e) => onCategoria(e.target.value)}>
            <option value="todas">Todas</option>
            <option value="ninguna">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Vence desde</span>
          <input
            type="date"
            value={isoToDay(filtros.fechaDesde)}
            onChange={(e) => set('fechaDesde', dayIso(e.target.value, 'start'))}
          />
        </label>
        <label className={styles.field}>
          <span>Vence hasta</span>
          <input
            type="date"
            value={isoToDay(filtros.fechaHasta)}
            onChange={(e) => set('fechaHasta', dayIso(e.target.value, 'end'))}
          />
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={filtros.vencidas ?? false}
            onChange={(e) => set('vencidas', e.target.checked || undefined)}
          />
          Sólo vencidas
        </label>
      </div>

      {etiquetas.length > 0 && (
        <div className={styles.tags}>
          <span className={styles.tagsLabel}>Etiquetas</span>
          {etiquetas.map((e) => {
            const activa = (filtros.etiquetas ?? []).includes(e.nombre);
            return (
              <button
                key={e.id}
                type="button"
                className={activa ? styles.tagOn : styles.tag}
                style={
                  activa ? { background: e.color, borderColor: e.color } : { borderColor: e.color }
                }
                aria-pressed={activa}
                onClick={() => toggleEtiqueta(e.nombre)}
              >
                {e.nombre}
              </button>
            );
          })}
        </div>
      )}

      {activos > 0 && (
        <button type="button" className={styles.clear} onClick={clear}>
          Limpiar filtros ({activos})
        </button>
      )}
    </div>
  );
}
