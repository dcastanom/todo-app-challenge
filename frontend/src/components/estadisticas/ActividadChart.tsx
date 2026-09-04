import type { EstadisticaActividadDia } from '@todo/shared';
import styles from './ActividadChart.module.css';

interface Props {
  actividad: EstadisticaActividadDia[];
}

/** Small daily bar chart — two bars per day (created / completed). No
 *  charting dependency: plain divs sized by percentage, CSS Modules. */
export function ActividadChart({ actividad }: Props): React.JSX.Element | null {
  if (actividad.length === 0) return null;

  const max = Math.max(...actividad.map((d) => Math.max(d.creadas, d.completadas)), 1);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.chart}
        role="img"
        aria-label={`Tareas creadas y completadas por día, últimos ${String(actividad.length)} días`}
      >
        {actividad.map((dia) => (
          <div
            key={dia.fecha}
            className={styles.columna}
            title={`${dia.fecha}: ${String(dia.creadas)} creadas, ${String(dia.completadas)} completadas`}
          >
            <div className={styles.barras}>
              <div className={styles.creadas} style={{ height: `${(dia.creadas / max) * 100}%` }} />
              <div
                className={styles.completadas}
                style={{ height: `${(dia.completadas / max) * 100}%` }}
              />
            </div>
            <span className={styles.fecha}>{dia.fecha.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className={styles.leyenda}>
        <span>
          <i className={styles.dotCreadas} /> Creadas
        </span>
        <span>
          <i className={styles.dotCompletadas} /> Completadas
        </span>
      </div>
    </div>
  );
}
