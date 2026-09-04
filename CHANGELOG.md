# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/);
el proyecto sigue [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-09-04

Primera versión lista para producción. Construida en 9 fases (0–8).

### Añadido

**Núcleo**
- Autenticación JWT con access + refresh, rotación de refresh y blacklist en Redis (`register`, `login`, `refresh`, `logout`, `profile`).
- CRUD de tareas con paginación, ordenamiento y soft-delete; toggle de completado.
- Categorías y etiquetas (CRUD + relación M:M); `TareaDTO` con categoría y etiquetas embebidas.
- Filtrado multidimensional: 8 filtros + búsqueda de texto con índices `pg_trgm`, y caché Redis por usuario con invalidación por versión.
- 10 queries de Business Intelligence (`npm run analytics`), documentadas en `BI-QUERIES.md`.

**Features bonus (Fase 8)**
- Reordenamiento manual por drag & drop (`PATCH /api/v1/tareas/reorder`, columna `posicion`).
- Modo oscuro con tres estados (system / light / dark), persistido en `localStorage`.
- Exportación CSV / JSON respetando los filtros activos (`GET /api/v1/tareas/export`).
- Atajos de teclado (⌘K / ⌘N / ⌘D / ? / Esc) con modal de ayuda.
- Operaciones en lote: completar / prioridad / mover categoría / eliminar (`PATCH /api/v1/tareas/batch`).
- Modo offline básico: indicador de conexión y borrador de la tarea nueva en `localStorage`.

**Infraestructura y operación (Fase 8)**
- Imágenes Docker de producción para backend y frontend + `docker-compose.prod.yml`.
- CI con jobs `verify` / `integration` / `e2e` / `docker` / `deploy`; publicación de imágenes a GHCR.
- Observabilidad: métricas Prometheus (`/metrics`), tracing OpenTelemetry (OTLP), stack Grafana + Jaeger (`docker-compose.observability.yml`), readiness probe (`/health/ready`).
- Documentación de la API: OpenAPI 3.1 + Swagger UI (`/api/v1/docs`).
- Error boundary de React en la raíz de la app.
- Auditoría de seguridad OWASP Top 10 (`docs/SECURITY.md`), guía de despliegue (`docs/DEPLOYMENT.md`) y de comandos (`docs/COMMANDS.md`).

### Calidad

- Cobertura de tests con gate ≥ 80 % (ramas ≥ 75 %) en CI.
- ~300 tests: unitarios (Jest / Vitest), integración contra Postgres/Redis reales, y E2E (Playwright).
- TypeScript strict en todo el monorepo, sin `any`.

### Seguridad conocida

- 4 advisories *moderate* de `esbuild` a través de `drizzle-kit` (dependencia **sólo de desarrollo**; el árbol de runtime está limpio — `npm audit --omit=dev`).
