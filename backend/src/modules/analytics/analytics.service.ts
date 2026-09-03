import type { Database } from '../../db/client.js';
import {
  q1ParticipacionUsuarios,
  q2TasaCompletado,
  q3RendimientoCategoria,
  q4PatronesProductividad,
  q5TareasVencidas,
  q6EstadisticasEtiquetas,
  q7RetencionUsuarios,
  q8DistribucionPrioridad,
  q9TendenciasEstacionales,
  q10BenchmarkingUsuarios,
  Q1_SQL,
  Q2_SQL,
  Q3_SQL,
  Q4_SQL,
  Q5_SQL,
  Q6_SQL,
  Q7_SQL,
  Q8_SQL,
  Q9_SQL,
  Q10_SQL,
} from './queries/index.js';

export interface AnalyticsQueryMeta {
  id: string;
  titulo: string;
  sql: string;
  run: (db: Database) => Promise<unknown[]>;
}

/** The 10 BI queries in order, with their SQL and executor. */
export const ANALYTICS_QUERIES: AnalyticsQueryMeta[] = [
  {
    id: 'Q1',
    titulo: 'Participación de usuarios (30 vs 30 días)',
    sql: Q1_SQL,
    run: q1ParticipacionUsuarios,
  },
  {
    id: 'Q2',
    titulo: 'Tasa de completado diaria por prioridad (90 días)',
    sql: Q2_SQL,
    run: q2TasaCompletado,
  },
  { id: 'Q3', titulo: 'Rendimiento por categoría', sql: Q3_SQL, run: q3RendimientoCategoria },
  {
    id: 'Q4',
    titulo: 'Patrones de productividad (hora / día)',
    sql: Q4_SQL,
    run: q4PatronesProductividad,
  },
  {
    id: 'Q5',
    titulo: 'Tareas vencidas por usuario y categoría',
    sql: Q5_SQL,
    run: q5TareasVencidas,
  },
  {
    id: 'Q6',
    titulo: 'Estadísticas de uso de etiquetas',
    sql: Q6_SQL,
    run: q6EstadisticasEtiquetas,
  },
  { id: 'Q7', titulo: 'Retención de usuarios (4 semanas)', sql: Q7_SQL, run: q7RetencionUsuarios },
  {
    id: 'Q8',
    titulo: 'Distribución de prioridad (usuarios activos)',
    sql: Q8_SQL,
    run: q8DistribucionPrioridad,
  },
  {
    id: 'Q9',
    titulo: 'Tendencias estacionales (12 meses)',
    sql: Q9_SQL,
    run: q9TendenciasEstacionales,
  },
  {
    id: 'Q10',
    titulo: 'Benchmarking: top 10% por tasa de completado',
    sql: Q10_SQL,
    run: q10BenchmarkingUsuarios,
  },
];

/**
 * Read-only analytics facade (ARQUITECTURA.md §3 AnalyticsService).
 * Each method maps 1:1 to a graded BI question.
 */
export class AnalyticsService {
  constructor(private readonly db: Database) {}

  participacionUsuarios() {
    return q1ParticipacionUsuarios(this.db);
  }
  tasaCompletado() {
    return q2TasaCompletado(this.db);
  }
  rendimientoCategoria() {
    return q3RendimientoCategoria(this.db);
  }
  patronesProductividad() {
    return q4PatronesProductividad(this.db);
  }
  tareasVencidas() {
    return q5TareasVencidas(this.db);
  }
  estadisticasEtiquetas() {
    return q6EstadisticasEtiquetas(this.db);
  }
  retencionUsuarios() {
    return q7RetencionUsuarios(this.db);
  }
  distribucionPrioridad() {
    return q8DistribucionPrioridad(this.db);
  }
  tendenciasEstacionales() {
    return q9TendenciasEstacionales(this.db);
  }
  benchmarkingUsuarios() {
    return q10BenchmarkingUsuarios(this.db);
  }
}
