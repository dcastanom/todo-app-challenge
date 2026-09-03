import type { Prioridad } from '@todo/shared';

/** Deterministic seed so every run produces the same dataset. */
export const SEED = 20260903;

export const COUNTS = {
  usuarios: 20,
  categoriasPorUsuario: [4, 7] as const,
  etiquetasPorUsuario: [6, 12] as const,
  tareasPorUsuario: [28, 46] as const,
  etiquetasPorTarea: [0, 4] as const,
};

/** ~610-820 tareas total — comfortably above the 500+ requirement. */
export const HISTORY_DAYS = 365;

export const RATIOS = {
  tareaCompletada: 0.58,
  tareaConCategoria: 0.8,
  tareaConDescripcion: 0.6,
  tareaConVencimiento: 0.7,
  tareaEliminada: 0.04,
  usuarioActivoUltimos7Dias: 0.6,
};

export const PRIORIDAD_PESOS: Record<Prioridad, number> = {
  baja: 20,
  normal: 45,
  alta: 25,
  urgente: 10,
};

/** Shared dev password for every seeded user. */
export const SEED_PASSWORD = 'Password123!';

export const CATEGORIA_POOL = [
  { nombre: 'Trabajo', color: '#3498db' },
  { nombre: 'Personal', color: '#9b59b6' },
  { nombre: 'Hogar', color: '#e67e22' },
  { nombre: 'Salud', color: '#2ecc71' },
  { nombre: 'Finanzas', color: '#16a085' },
  { nombre: 'Estudio', color: '#f39c12' },
  { nombre: 'Proyectos', color: '#e74c3c' },
  { nombre: 'Compras', color: '#1abc9c' },
  { nombre: 'Viajes', color: '#34495e' },
  { nombre: 'Familia', color: '#d35400' },
];

export const ETIQUETA_POOL = [
  'urgente',
  'revisar',
  'bloqueado',
  'en-progreso',
  'idea',
  'reunion',
  'seguimiento',
  'importante',
  'rapido',
  'delegado',
  'esperando',
  'cliente',
  'documentacion',
  'bug',
];
