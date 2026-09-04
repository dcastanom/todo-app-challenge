# Comandos manuales

Todo se ejecuta desde la raíz del repo salvo que se indique. Requisitos: Node ≥ 20, Docker Desktop.

## 1. Montar la aplicación

### 1.1 Preparación (una vez)

```bash
cp .env.example .env          # en PowerShell: Copy-Item .env.example .env
npm install
npm run build:shared          # compila @todo/shared (también lo hace predev/prebuild)
```

### 1.2 Servicios (PostgreSQL + Redis)

```bash
npm run db:up                 # postgres :5544, redis :6399
# npm run db:logs / npm run db:down
```

### 1.3 Base de datos

```bash
npm run db:migrate --workspace backend    # migraciones 0000..0002
npm run db:seed    --workspace backend    # ~780 tareas; demo@todo.app / Password123!
npm run db:verify  --workspace backend    # (opcional)
```

### 1.4 Servidores de desarrollo (dos terminales)

```bash
npm run dev:backend           # http://localhost:4000  (health /health, docs /api/v1/docs)
npm run dev:frontend          # http://localhost:5173
```

### 1.5 Scripts adicionales

```bash
npm run analytics --workspace backend               # 10 queries BI + tiempos
npm run analytics --workspace backend -- --explain  # + EXPLAIN ANALYZE
npm run db:studio  --workspace backend              # Drizzle Studio
npm run db:reset   --workspace backend              # vacía todas las tablas
```

### 1.6 Producción (Docker)

```bash
docker compose -f docker-compose.prod.yml up --build
#   frontend :8080   backend :4000   (migraciones se aplican al arrancar el backend)

# con observabilidad:
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up --build
#   Grafana :3001 (admin/admin)   Prometheus :9090   Jaeger :16686
```

## 2. Tests por capa

### 2.1 Unitarios (sin Docker)

```bash
npm test                                   # backend (Jest) + frontend (Vitest)
npm test --workspace backend
npm test --workspace frontend
npm test --workspace backend  -- jwt       # un archivo / patrón
npm run test:watch --workspace frontend
```

### 2.2 Integración (necesita servicios + migrado + seed)

```bash
npm run test:integration --workspace backend
```

### 2.3 Cobertura (gate ≥80%, ramas ≥75%)

```bash
npm run test:coverage                       # backend (unit+integración) + frontend
npm run test:coverage --workspace backend
npm run test:coverage --workspace frontend  # no necesita servicios
```

### 2.4 E2E (Playwright — necesita servicios + navegador)

```bash
npm run install-browsers --workspace @todo/e2e     # una vez
npm run test:e2e                                    # arranca backend+frontend solo
npm run e2e:ui     --workspace @todo/e2e            # modo interactivo
npm run report     --workspace @todo/e2e            # último reporte HTML

# contra servidores ya levantados (deben tener NODE_ENV=test):
E2E_NO_WEBSERVER=1 npm run test:e2e
```

### 2.5 Pipeline local completo (como CI)

```bash
npm run format:check && npm run lint && npm run typecheck
npm test                 # unit
npm run test:coverage    # unit + integración + cobertura   (servicios arriba)
npm run test:e2e         # e2e                                (servicios arriba)
```
