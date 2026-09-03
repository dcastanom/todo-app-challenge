import { PRIORIDADES } from '@todo/shared';
import { db, pool } from '../../../src/db/client.js';
import {
  AnalyticsService,
  ANALYTICS_QUERIES,
} from '../../../src/modules/analytics/analytics.service.js';

const analytics = new AnalyticsService(db);

afterAll(async () => {
  await pool.end();
});

describe('BI queries — latency', () => {
  it.each(ANALYTICS_QUERIES.map((q) => [q.id, q]))('%s runs in under 1s', async (_id, q) => {
    const started = performance.now();
    const rows = await q.run(db);
    const ms = performance.now() - started;

    expect(Array.isArray(rows)).toBe(true);
    expect(ms).toBeLessThan(1000);
  });
});

describe('Q1 — participación de usuarios', () => {
  it('returns a single summary row with the two averages', async () => {
    const [row] = await analytics.participacionUsuarios();
    expect(row).toBeDefined();
    expect(Number(row?.usuarios_activos_60d)).toBeGreaterThan(0);
    expect(Number(row?.promedio_ultimos_30)).toBeGreaterThanOrEqual(0);
    expect(Number(row?.promedio_previos_30)).toBeGreaterThanOrEqual(0);
  });
});

describe('Q2 — tasa de completado diaria por prioridad', () => {
  it('only reports valid priorities and rates in 0..100 for the last 90 days', async () => {
    const rows = await analytics.tasaCompletado();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(PRIORIDADES).toContain(r.prioridad);
      expect(r.tareas_completadas).toBeLessThanOrEqual(r.tareas_creadas);
      expect(Number(r.tasa_completado_pct)).toBeGreaterThanOrEqual(0);
      expect(Number(r.tasa_completado_pct)).toBeLessThanOrEqual(100);
    }
  });
});

describe('Q3 — rendimiento por categoría', () => {
  it('is ranked by completion rate desc with non-negative completion times', async () => {
    const rows = await analytics.rendimientoCategoria();
    expect(rows.length).toBeGreaterThan(0);
    const rates = rows.map((r) => Number(r.tasa_completado_pct));
    expect([...rates]).toEqual([...rates].sort((a, b) => b - a));
    for (const r of rows) {
      if (r.dias_promedio_completado !== null) {
        expect(Number(r.dias_promedio_completado)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('Q4 — patrones de productividad', () => {
  it('covers both events across both marginal dimensions with valid buckets', async () => {
    const rows = await analytics.patronesProductividad();
    expect(new Set(rows.map((r) => r.evento))).toEqual(new Set(['creacion', 'completado']));
    expect(new Set(rows.map((r) => r.dimension))).toEqual(new Set(['hora_del_dia', 'dia_semana']));
    for (const r of rows) {
      if (r.dimension === 'hora_del_dia') {
        expect(r.valor).toBeGreaterThanOrEqual(0);
        expect(r.valor).toBeLessThanOrEqual(23);
      } else {
        expect(r.valor).toBeGreaterThanOrEqual(1);
        expect(r.valor).toBeLessThanOrEqual(7);
      }
    }
  });
});

describe('Q5 — tareas vencidas', () => {
  it('includes a grand-total ROLLUP row and only overdue tasks', async () => {
    const rows = await analytics.tareasVencidas();
    expect(rows.length).toBeGreaterThan(0);
    const total = rows.find((r) => r.nivel === 'total_general');
    expect(total).toBeDefined();
    expect(Number(total?.tareas_vencidas)).toBeGreaterThan(0);
    expect(rows.some((r) => r.nivel === 'subtotal_usuario')).toBe(true);
    for (const r of rows) {
      expect(Number(r.dias_promedio_vencida)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Q6 — estadísticas de etiquetas', () => {
  it('is ranked by usage desc', async () => {
    const rows = await analytics.estadisticasEtiquetas();
    expect(rows.length).toBeGreaterThan(0);
    const uses = rows.map((r) => r.veces_usada);
    expect([...uses]).toEqual([...uses].sort((a, b) => b - a));
  });
});

describe('Q7 — retención de usuarios', () => {
  it('returns 4 weekly rows and a stable 4-week cohort count', async () => {
    const rows = await analytics.retencionUsuarios();
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.semana_offset).sort()).toEqual([0, 1, 2, 3]);
    const cohort = new Set(rows.map((r) => r.usuarios_retenidos_4_semanas));
    expect(cohort.size).toBe(1);
  });
});

describe('Q8 — distribución de prioridad (usuarios activos)', () => {
  it('only reports valid priorities and percentages that sum to ~100', async () => {
    const rows = await analytics.distribucionPrioridad();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(PRIORIDADES).toContain(r.prioridad);
    const sum = rows.reduce((acc, r) => acc + Number(r.porcentaje), 0);
    expect(sum).toBeGreaterThan(99);
    expect(sum).toBeLessThan(101);
  });
});

describe('Q9 — tendencias estacionales', () => {
  it('returns exactly 12 months in chronological order', async () => {
    const rows = await analytics.tendenciasEstacionales();
    expect(rows).toHaveLength(12);
    const meses = rows.map((r) => r.mes);
    expect([...meses]).toEqual([...meses].sort());
  });
});

describe('Q10 — benchmarking top 10%', () => {
  it('returns only users at or above the 90th percentile, ranked by rate desc', async () => {
    const rows = await analytics.benchmarkingUsuarios();
    expect(rows.length).toBeGreaterThan(0);
    const rates = rows.map((r) => Number(r.tasa_completado_pct));
    expect([...rates]).toEqual([...rates].sort((a, b) => b - a));
    for (const r of rows) {
      expect(Number(r.percentil_tasa)).toBeGreaterThanOrEqual(90);
    }
  });
});
