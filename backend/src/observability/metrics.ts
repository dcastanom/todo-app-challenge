import type { Request, RequestHandler } from 'express';
import { collectDefaultMetrics, Histogram, Registry } from 'prom-client';

/** Dedicated registry so tests can build isolated instances if needed. */
export const registry = new Registry();
registry.setDefaultLabels({ service: process.env.OTEL_SERVICE_NAME ?? 'todo-backend' });
collectDefaultMetrics({ register: registry });

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Normalises a path to its route pattern so UUIDs don't explode cardinality. */
function routeLabel(req: Request): string {
  const route = (req.route as { path?: string } | undefined)?.path;
  const full = `${req.baseUrl}${typeof route === 'string' ? route : ''}` || req.path;
  return full.replace(UUID_RE, ':id');
}

/** Times every request and records it against the resolved route pattern. */
export const metricsMiddleware: RequestHandler = (req, res, next) => {
  if (req.path === '/metrics') return next();
  const end = httpDuration.startTimer({ method: req.method });
  res.on('finish', () => {
    end({ route: routeLabel(req), status: String(res.statusCode) });
  });
  next();
};

/** `GET /metrics` — Prometheus exposition format. */
export const metricsHandler: RequestHandler = (_req, res) => {
  void registry
    .metrics()
    .then((body) => {
      res.setHeader('Content-Type', registry.contentType);
      res.send(body);
    })
    .catch(() => res.status(500).end());
};
