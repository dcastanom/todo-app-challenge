# Auditoría de seguridad (US-103)

Revisión del MVP v1.0.0 contra **OWASP Top 10 (2021)**. Alcance: API Express,
cliente React, configuración de despliegue.

| # | Categoría | Estado | Controles / notas |
|---|---|---|---|
| A01 | Broken Access Control | ✅ | Cada endpoint de recurso pasa por `requireAuth`. Todas las queries de tareas/categorías/etiquetas están *scoped* por `usuario_id`; `reorder` y `batch` validan propiedad de **todos** los ids antes de escribir (404 si alguno no pertenece). Soft-delete no expone filas borradas. |
| A02 | Cryptographic Failures | ✅ | Contraseñas con `bcrypt` (coste 12). JWT access (15 min) + refresh (7 d) con **rotación** y blacklist en Redis al hacer logout. Secretos ≥ 32 caracteres validados en boot (`env.ts`). Sin datos sensibles en logs (Pino no serializa el body). HSTS vía Helmet. TLS es responsabilidad del proxy/hosting. |
| A03 | Injection | ✅ | Drizzle ORM parametriza todo; el único SQL "crudo" son las 10 queries BI, con parámetros y sin input de usuario interpolado. Validación de entrada con Zod en body y query. `ILIKE` de búsqueda escapa `% _ \`. Sin `eval`/`child_process`. |
| A04 | Insecure Design | ✅ | Rate limiting global (100/15 min) + estricto en `/auth/login` y `/auth/register` (10/15 min). Paginación obligatoria (`limit` máx 100). Export limitado a `EXPORT_MAX_ROWS`. Lote limitado a 200 ids. |
| A05 | Security Misconfiguration | ✅ | Helmet (CSP `default-src 'self'`, `x-powered-by` off, `frame-ancestors 'self'`). CORS con origen explícito y allowlist única. Errores 500 no filtran stack en producción (`isProduction` en el error handler). CSP relajado **sólo** en `/api/v1/docs`. nginx añade `nosniff` / `DENY` / `Referrer-Policy`. |
| A06 | Vulnerable & Outdated Components | ⚠️ | `npm audit`: 4 vulnerabilidades *moderate* en dependencias **sólo de desarrollo** (`esbuild` vía `drizzle-kit`, no llega a producción). Sin vulnerabilidades en el árbol de runtime. Dependabot/renovate recomendado post-release. |
| A07 | Identification & Authentication Failures | ✅ | Política de contraseña (≥ 8, letra + dígito). Brute-force mitigado por el limiter de auth. Refresh rotation invalida un refresh reusado. Sin "recuérdame" persistente inseguro: tokens en `localStorage` con limpieza en logout y en fallo de refresh (evento `session-expired`). |
| A08 | Software & Data Integrity Failures | ✅ | Sin deserialización insegura. CI corre lint + typecheck + tests + build antes de publicar imágenes. Imágenes etiquetadas por SHA. Assets de Swagger UI pinneados a una versión exacta de cdnjs. |
| A09 | Security Logging & Monitoring Failures | ✅ | `pino-http` registra cada request con id, método, ruta, status y latencia. Métricas Prometheus (`/metrics`) con tasa de 4xx/5xx en el dashboard. Tracing OTLP opcional. Errores no controlados se loguean con `logger.error({ err })`. |
| A10 | Server-Side Request Forgery | ✅ | El backend no hace peticiones salientes a URLs controladas por el usuario. El único fetch saliente es el exporter OTLP a un endpoint de configuración. |

## Comprobaciones adicionales

- **Headers** (`curl -I`): `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`, sin `X-Powered-By`.
- **Rate limit**: respuesta 429 con envelope `{ error: { code: 'RATE_LIMIT' } }` (desactivado sólo con `NODE_ENV=test`).
- **Secrets**: `.env` en `.gitignore`; `.env.example` sin valores reales; `.dockerignore` excluye `**/.env`.
- **CORS**: `credentials: true` con origen único (no wildcard).

## Pendiente / recomendado post-v1.0

- `npm audit fix` para las advisories de `esbuild` cuando `drizzle-kit` publique una versión con la dependencia actualizada.
- Rotar `JWT_SECRET` / `JWT_REFRESH_SECRET` fuera del repo (gestor de secretos del hosting).
- Añadir cabecera `Permissions-Policy` en nginx.
- 2FA / verificación de email (fuera del alcance del MVP).
