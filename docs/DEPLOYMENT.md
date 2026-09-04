# Despliegue

## Imágenes

Dos imágenes, ambas construidas desde la raíz del repo:

| Imagen | Dockerfile | Contenido |
|---|---|---|
| `todo-backend` | `backend/Dockerfile` | API Express compilada + deps de producción; `tini` como PID 1; aplica migraciones y arranca el server. |
| `todo-frontend` | `frontend/Dockerfile` | Bundle de Vite servido por nginx; `nginx.conf` proxya `/api` al backend. |

```bash
docker build -f backend/Dockerfile  -t todo-backend .
docker build -f frontend/Dockerfile --build-arg VITE_API_BASE_URL=/api/v1 -t todo-frontend .
```

CI (`.github/workflows/ci.yml`, job `docker`) las construye en cada PR y las publica en
`ghcr.io/<owner>/todo-app-challenge-{backend,frontend}` (`latest` + short SHA) en cada push a `main`.

## Stack con Docker Compose

```bash
cp .env.example .env
# Ajusta como mínimo:
#   JWT_SECRET, JWT_REFRESH_SECRET   (openssl rand -hex 32)
#   POSTGRES_PASSWORD
#   CORS_ORIGIN                      (URL pública del frontend)
docker compose -f docker-compose.prod.yml up --build -d
```

- El backend ejecuta `node dist/db/migrate.js` antes de arrancar, así que las
  migraciones se aplican solas en cada despliegue.
- El seed **no** se ejecuta en producción (usa `@faker-js/faker`, que es devDependency).
- Volúmenes con estado: `postgres_data`, `redis_data`.

### Variables de entorno (backend)

| Variable | Requerida | Nota |
|---|---|---|
| `DATABASE_URL` | sí | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | sí | `redis://host:6379` |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | sí | ≥ 32 caracteres |
| `CORS_ORIGIN` | sí | origen exacto del frontend |
| `PORT` | no | por defecto 4000 en la imagen |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | no | 15 min / 100 req por defecto |
| `METRICS_ENABLED` | no | `true` por defecto (`GET /metrics`) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | activa el tracing (ej. `http://jaeger:4318`) |

## Observabilidad

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up --build -d
```

- **Prometheus** (`:9090`) — scrapea `backend:4000/metrics` cada 15 s.
- **Grafana** (`:3001`, admin/admin) — datasource y dashboard "Todo Backend" provisionados desde `observability/grafana/`.
- **Jaeger** (`:16686`) — recibe trazas OTLP; el override fija `OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318`.

## Health checks

| Endpoint | Uso |
|---|---|
| `GET /health` | liveness (no toca dependencias) |
| `GET /health/ready` | readiness — 200 si Postgres y Redis responden, 503 si no |

Ambas imágenes definen `HEALTHCHECK`. Para orquestadores: liveness → `/health`, readiness → `/health/ready`.

## Rollback

Las imágenes van etiquetadas con el short SHA del commit. Para volver atrás,
re-desplegar con el tag anterior. Las migraciones son aditivas (índices y
columnas nuevas), así que un rollback de una versión es seguro sin revertir el schema.
