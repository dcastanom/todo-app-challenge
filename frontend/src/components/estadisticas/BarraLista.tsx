import styles from './BarraLista.module.css';

export interface BarraItem {
  key: string;
  label: string;
  total: number;
  completadas: number;
  color?: string | null;
}

interface Props {
  items: BarraItem[];
  vacio: string;
}

/** Horizontal bar list: bar length ∝ total count, filled portion ∝ % completed. */
export function BarraLista({ items, vacio }: Props): React.JSX.Element {
  if (items.length === 0) {
    return <p className={styles.vacio}>{vacio}</p>;
  }

  const max = Math.max(...items.map((i) => i.total), 1);

  return (
    <ul className={styles.lista}>
      {items.map((item) => {
        const anchoTotal = (item.total / max) * 100;
        const pctCompletado =
          item.total > 0 ? Math.round((item.completadas / item.total) * 100) : 0;
        return (
          <li key={item.key} className={styles.fila}>
            <div className={styles.encabezado}>
              <span className={styles.etiqueta}>
                {item.color && (
                  <span className={styles.punto} style={{ background: item.color }} aria-hidden />
                )}
                {item.label}
              </span>
              <span className={styles.conteo}>
                {item.completadas}/{item.total} · {pctCompletado}%
              </span>
            </div>
            <div
              className={styles.pista}
              role="img"
              aria-label={`${item.label}: ${item.total} tareas, ${pctCompletado}% completadas`}
            >
              <div className={styles.barraTotal} style={{ width: `${anchoTotal}%` }}>
                <div className={styles.barraCompletada} style={{ width: `${pctCompletado}%` }} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
