import { Router } from 'express';
import { API_PREFIX } from '@todo/shared';
import { openapiSpec } from './openapi.js';

export const docsRouter: Router = Router();

const SWAGGER_VERSION = '5.17.14';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_VERSION}`;

/** The machine-readable spec. */
docsRouter.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});

/** Swagger UI — assets from cdnjs, spec from this server. */
docsRouter.get('/docs', (_req, res) => {
  // Relax Helmet's default CSP for this page only (cdnjs assets + inline boot).
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "img-src 'self' data: https://cdnjs.cloudflare.com",
      "connect-src 'self'",
    ].join('; '),
  );
  res.type('html').send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Todo App API — Docs</title>
  <link rel="stylesheet" href="${CDN}/swagger-ui.min.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${CDN}/swagger-ui-bundle.min.js"></script>
  <script src="${CDN}/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '${API_PREFIX}/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
    });
  </script>
</body>
</html>`);
});
