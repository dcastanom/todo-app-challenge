/**
 * OpenTelemetry tracing — active only when `OTEL_EXPORTER_OTLP_ENDPOINT` is
 * set (e.g. the Jaeger/OTLP collector in docker-compose.observability.yml).
 * A no-op otherwise, so dev and tests are unaffected.
 *
 * Must be started before Express/pg are imported — `index.ts` calls
 * `startTracing()` first thing.
 */
let started = false;

export async function startTracing(): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (started || !endpoint) return;
  started = true;

  const [
    { NodeSDK },
    { OTLPTraceExporter },
    { HttpInstrumentation },
    { ExpressInstrumentation },
    { PgInstrumentation },
    { resourceFromAttributes },
    { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION },
  ] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/instrumentation-http'),
    import('@opentelemetry/instrumentation-express'),
    import('@opentelemetry/instrumentation-pg'),
    import('@opentelemetry/resources'),
    import('@opentelemetry/semantic-conventions'),
  ]);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'todo-backend',
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  sdk.start();
  process.once('SIGTERM', () => void sdk.shutdown());
  process.once('SIGINT', () => void sdk.shutdown());
}
