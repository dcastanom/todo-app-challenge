import { useNavigate } from 'react-router-dom';
import type { Prioridad } from '@todo/shared';
import { ActividadChart } from '../components/estadisticas/ActividadChart.js';
import { BarraLista } from '../components/estadisticas/BarraLista.js';
import { StatCard } from '../components/estadisticas/StatCard.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { Spinner } from '../components/common/Spinner.js';
import { useAuth } from '../hooks/useAuth.js';
import { useEstadisticas } from '../hooks/useEstadisticas.js';
import styles from './EstadisticasPage.module.css';

const LABEL_PRIORIDAD: Record<Prioridad, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

const VENTANAS = [7, 14, 30, 90] as const;

export function EstadisticasPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, status, error, dias, setDias, refresh } = useEstadisticas();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Estadísticas</h1>
          <p className={styles.subtitle}>
            {user?.nombreCompleto ?? user?.username} · se actualiza en vivo
          </p>
        </div>
        <div className={styles.acciones}>
          <label className={styles.ventana}>
            Ventana
            <select
              value={dias}
              onChange={(e) => {
                setDias(Number(e.target.value));
              }}
            >
              {VENTANAS.map((v) => (
                <option key={v} value={v}>
                  {v} días
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void navigate('/')}>
            ← Volver a tareas
          </button>
        </div>
      </header>

      {status === 'loading' && !data && <Spinner label="Cargando estadísticas…" />}
      {status === 'error' && (
        <ErrorMessage
          message={error ?? 'No se pudieron cargar las estadísticas'}
          onRetry={() => void refresh()}
        />
      )}

      {data && (
        <div className={styles.contenido}>
          <div className={styles.stats}>
            <StatCard label="Total de tareas" value={data.total} />
            <StatCard label="Completadas" value={data.completadas} tone="success" />
            <StatCard label="Pendientes" value={data.pendientes} />
            <StatCard label="Vencidas" value={data.vencidas} tone="danger" />
            <StatCard
              label="Tasa de completado"
              value={`${String(Math.round(data.tasaCompletado * 100))}%`}
            />
          </div>

          <section className={styles.seccion}>
            <h2>Por prioridad</h2>
            <BarraLista
              vacio="Todavía no hay tareas."
              items={data.porPrioridad.map((p) => ({
                key: p.prioridad,
                label: LABEL_PRIORIDAD[p.prioridad],
                total: p.total,
                completadas: p.completadas,
              }))}
            />
          </section>

          <section className={styles.seccion}>
            <h2>Por categoría</h2>
            <BarraLista
              vacio="Todavía no hay tareas."
              items={data.porCategoria.map((c) => ({
                key: c.categoriaId ?? 'sin-categoria',
                label: c.nombre,
                total: c.total,
                completadas: c.completadas,
                color: c.color,
              }))}
            />
          </section>

          <section className={styles.seccion}>
            <h2>Actividad · últimos {dias} días</h2>
            <ActividadChart actividad={data.actividad} />
          </section>
        </div>
      )}
    </div>
  );
}
