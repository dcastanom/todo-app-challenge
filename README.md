# Full-Stack Todo App

Aplicación de lista de tareas: **React + TypeScript** (frontend), **Node.js + Express + TypeScript + Drizzle** (backend), **PostgreSQL 16** + **Redis 7**.

Monorepo con npm workspaces:

```
.
├── backend/            API Express + Drizzle ORM
│   ├── src/db/schema/  10 tablas Drizzle
│   ├── src/db/seed/    seed determinista (faker)
│   ├── src/docs/       spec OpenAPI + Swagger UI
│   ├── src/observability/  métricas Prometheus + tracing OTLP
│   └── drizzle/        migraciones SQL (versionadas)
├── frontend/           Cliente React + Vite  (+ Dockerfile/nginx.conf)
├── packages/shared/    Tipos y esquemas Zod compartidos (@todo/shared)
├── e2e/                Tests end-to-end (Playwright)
├── observability/      Config de Prometheus + Grafana (dashboards) + Promtail
├── docker-compose.yml               Postgres + Redis (desarrollo)
├── docker-compose.prod.yml          Stack completo con imágenes construidas (proyecto "todo-prod")
└── docker-compose.observability.yml Prometheus + Grafana + Jaeger + Loki/Promtail
```

## Requisitos

- Node.js >= 20 (ver `.nvmrc`)
- Docker + Docker Compose

## Puesta en marcha (desarrollo)

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Dependencias (+ compilar @todo/shared)
npm install
npm run build:shared

# 3. Base de datos y cache  (Postgres → localhost:5544, Redis → localhost:6399)
npm run db:up

# 4. Migraciones + datos de ejemplo
npm run db:migrate --workspace backend
npm run db:seed    --workspace backend
npm run db:verify  --workspace backend   # comprueba schema + datos

# 5. Servidores de desarrollo (en dos terminales)
npm run dev:backend    # http://localhost:4000   (health: /health, docs: /api/v1/docs)
npm run dev:frontend   # http://localhost:5173
```

Cuenta demo tras el seed: `demo@todo.app` / `Password123!`

## Scripts (raíz)

| Script | Descripción |
|---|---|
| `npm run lint` / `lint:fix` | ESLint sobre todo el repo |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc --noEmit` en cada workspace |
| `npm test` | Tests unitarios (Jest en backend, Vitest en frontend) |
| `npm run test:coverage` | Backend (unit + integración) + frontend, con gate ≥80% |
| `npm run test:e2e` | Playwright (arranca sus propios servidores) |
| `npm run build` | Compila shared + backend + frontend |
| `npm run db:up` / `db:down` / `db:logs` | Ciclo de vida de PostgreSQL + Redis |

### Base de datos (`--workspace backend`)

| Script | Descripción |
|---|---|
| `db:generate` | Genera migración SQL a partir de cambios en `src/db/schema/` |
| `db:migrate` | Aplica migraciones |
| `db:seed` | Carga ~780 tareas de ejemplo (determinista) |
| `db:verify` | Verifica tablas, índices, constraints y forma de los datos |
| `db:reset` | Vacía todas las tablas |
| `db:studio` | Drizzle Studio |
| `analytics` | Ejecuta las 10 queries BI (`-- --explain` para los planes) |

Un solo test backend: `npm test --workspace backend -- health`.
Integración (necesita Postgres + Redis): `npm run test:integration --workspace backend`.
E2E: primero `npm run install-browsers --workspace @todo/e2e`, luego `npm run test:e2e`.

> Para el listado completo de comandos manuales (montar la app, cada capa de
> tests por separado) ver [`docs/COMMANDS.md`](docs/COMMANDS.md).

## Producción (Docker)

```bash
cp .env.example .env   # ajusta JWT_*, POSTGRES_*, CORS_ORIGIN
docker compose -f docker-compose.prod.yml up --build
# frontend → http://localhost:8080   backend → http://localhost:4000 (+ /socket.io)
```

`docker-compose.prod.yml` fija su propio proyecto de Compose (`name: todo-prod`) — podés tenerlo
levantado **a la vez** que `npm run db:up` (dev) sin que se pisen. Si además tenés `dev:backend`/
`dev:frontend` corriendo en 4000/5173, pasale otros puertos y el origen del frontend de este stack:

```bash
BACKEND_PORT=4001 CORS_ORIGIN=http://localhost:8080 \
  docker compose -f docker-compose.prod.yml up --build -d
```

Con observabilidad (Prometheus + Grafana + Jaeger + Loki/Promtail para logs):

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up --build
# Grafana → http://localhost:3001 (admin/admin, dashboard "Todo Backend" con panel de logs)
# Jaeger  → http://localhost:16686   Loki (vía Grafana, no directo) → :3101
```

Guía detallada: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · paso a paso para AWS (EC2, desde cero): [`docs/DEPLOYMENT-AWS.md`](docs/DEPLOYMENT-AWS.md).

## Observabilidad

- **Logs**: Pino estructurado (JSON en prod, `pino-pretty` en dev), con id de request vía `pino-http`. En Docker, `docker compose ... logs -f backend`; con el stack de observabilidad, buscables en Grafana (Loki) sin instalar nada en el host — Promtail tailea el stdout de cada contenedor vía el socket de Docker.
- **Métricas**: `GET /metrics` en formato Prometheus — colectores por defecto de Node + histograma `http_request_duration_seconds` (etiquetado por `method` / `route` / `status`).
- **Tracing**: OpenTelemetry (http + express + pg) exportado por OTLP. Inactivo salvo que se defina `OTEL_EXPORTER_OTLP_ENDPOINT`.
- **Readiness**: `GET /health/ready` comprueba Postgres + Redis (503 si alguno cae).
- **Tiempo real**: Socket.IO comparte el puerto del backend (`/socket.io`, mismo JWT que la API). `frontend/nginx.conf` ya lo proxea con upgrade a WebSocket; un proxy propio en producción necesita hacer lo mismo.

## Documentación de la API

- Swagger UI: `http://localhost:4000/api/v1/docs`
- Spec OpenAPI 3.1: `http://localhost:4000/api/v1/openapi.json`

## Troubleshooting

| Síntoma | Causa / solución |
|---|---|
| `Invalid environment configuration` al arrancar el backend | Falta `.env` o alguna variable. `cp .env.example .env`. |
| `db:migrate` falla con ECONNREFUSED | Postgres no está arriba: `npm run db:up`. |
| Los E2E fallan con "Demasiadas peticiones" | Hay un `dev:backend` viejo en el puerto 4000 sin `NODE_ENV=test` y Playwright lo reutiliza. Mátalo y reintenta. |
| `drizzle-kit` pide "install latest drizzle-orm" | `drizzle-orm` está también en las dependencias de la raíz para que el CLI hoisteado lo resuelva. |
| Puerto 5432/6379 ocupado | Los puertos de host están desplazados (5544 / 6399); revisa `.env`. |
| Swagger UI en blanco | Requiere acceso a `cdnjs.cloudflare.com` (CSP relajado sólo para `/api/v1/docs`). |
| `docker compose -f docker-compose.prod.yml down` se lleva puestos los contenedores de **dev** | No debería pasar — `name: todo-prod` aísla el proyecto. Si igual pasa (p. ej. clonaste antes de ese fix), los datos sobreviven (`down` sin `-v` nunca borra volúmenes); `npm run db:up` los vuelve a levantar sobre los mismos volúmenes. |
| El frontend del stack de prod no puede loguearse / CORS error | `CORS_ORIGIN` en tu `.env` compartido apunta al Vite de dev (`:5173`). Para el stack de prod, pasalo aparte: `CORS_ORIGIN=http://localhost:8080 docker compose -f docker-compose.prod.yml up -d` (no edites el `.env` si el backend de dev sigue corriendo). |

## Estado

- [x] **Fase 0** — Setup: monorepo, TypeScript strict, ESLint + Prettier + Husky + commitlint, Docker Compose, CI base.
- [x] **Fase 1** — Base de datos: 10 tablas Drizzle + migración inicial, seed determinista (500+ tareas), script de verificación.
- [x] **Fase 2** — 10 queries de analítica (BI): documentadas con salida de ejemplo en [`BI-QUERIES.md`](BI-QUERIES.md).
- [x] **Fase 3** — Autenticación: JWT (access + refresh con rotación en Redis), bcrypt, `AuthProvider` + `HttpClient` (Adapter).
- [x] **Fase 4** — CRUD de tareas con paginación y ordenamiento; `useTodos` optimista.
- [x] **Fase 5** — Categorías & Etiquetas: CRUD, relación M:M, `TareaDTO` embebido.
- [x] **Fase 6** — Filtrado multidimensional: 8 filtros + búsqueda de texto (`pg_trgm`), caché Redis por usuario.
- [x] **Fase 7** — Testing completo: gate de cobertura ≥80% en CI (jobs `verify` / `integration` / `e2e`).
- [x] **Fase 8** — Infraestructura (Docker prod, CI/CD con publicación de imágenes, observabilidad con logs/métricas/trazas), **features bonus** (drag & drop, dark mode, export CSV/JSON, atajos de teclado, operaciones en lote, modo offline, dashboard de estadísticas, actualizaciones en tiempo real vía Socket.IO) y documentación (Swagger, seguridad, release v1.1.0).

Documentación de arquitectura y plan: `CLAUDE.md`, `ARQUITECTURA.md`, `PLANIFICACION.md`, `PLAN_COMMITS.md`.
Auditoría de seguridad: [`docs/SECURITY.md`](docs/SECURITY.md) · Cambios: [`CHANGELOG.md`](CHANGELOG.md).
