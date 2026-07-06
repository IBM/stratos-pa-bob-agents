'use strict';

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');
const swaggerUi  = require('swagger-ui-dist');

const crmRoutes    = require('./routes/crm');
const erpRoutes    = require('./routes/erp');
const healthRoutes = require('./routes/health');

const app     = express();
const PORT    = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || 'workshop-demo-key';

// ── Middleware ────────────────────────────────────────────────────────────────
// Relax helmet CSP so Swagger UI inline scripts load correctly
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
    }
  }
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// ── Simple API-key auth (skip for public pages) ───────────────────────────────
const PUBLIC_PATHS = ['/health', '/', '/docs', '/demo', '/api-spec'];
app.use((req, res, next) => {
  if (PUBLIC_PATHS.some(p => req.path === p || req.path.startsWith('/docs') || req.path.startsWith('/docs-assets/'))) {
    return next();
  }
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Valid X-Api-Key header required' });
  }
  next();
});

// ── Root discovery endpoint ───────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'SalesLens — FP&A External Systems API',
    version: '1.0.0',
    description: 'Mock CRM and ERP endpoints for the FP&A Variance Autopilot workshop',
    ui: '/demo',
    docs: '/docs',
    openapi: '/api-spec',
    health: '/health',
    endpoints: {
      crm: {
        base: '/crm',
        routes: [
          'GET /crm/deals?dept_id=&period=&status=',
          'GET /crm/deals/:deal_id',
          'GET /crm/pipeline-summary?dept_id=&period=',
          'GET /crm/variance-context?dept_id=&period=&account_id='
        ]
      },
      erp: {
        base: '/erp',
        routes: [
          'GET /erp/purchase-orders?dept_id=&period=&account_id=',
          'GET /erp/headcount-events?dept_id=&period=',
          'GET /erp/cost-context?dept_id=&period=&account_id='
        ]
      }
    }
  });
});

// ── OpenAPI spec (for Orchestrate tool import) ────────────────────────────────
app.get('/api-spec', (req, res) => {
  res.json(require('./openapi.json'));
});

// ── Swagger UI at /docs and /docs/ ───────────────────────────────────────────
const swaggerUiPath = swaggerUi.getAbsoluteFSPath();

// Serve the Swagger HTML inline — both /docs and /docs/ without any redirect
// (a redirect causes a loop because express.static catches /docs/ before this handler)
function serveSwaggerHtml(req, res) {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SalesLens — API Docs</title>
  <link rel="stylesheet" href="/docs-assets/swagger-ui.css">
  <style>
    body { margin: 0; }
    .topbar { background: #161616 !important; }
    .topbar-wrapper img { display: none; }
    .topbar-wrapper::before {
      content: 'SalesLens — FP&A External Systems API';
      color: #fff; font-size: 17px; font-weight: 700; padding-left: 16px;
    }
    .swagger-ui .info .title { color: #0f62fe; }
    .swagger-ui .scheme-container { background: #f4f4f4; padding: 12px 20px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs-assets/swagger-ui-bundle.js"></script>
  <script src="/docs-assets/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api-spec',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
        deepLinking: true,
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        requestInterceptor: function(req) {
          req.headers['X-Api-Key'] = 'workshop-demo-key';
          return req;
        }
      });
    };
  </script>
</body>
</html>`);
}

app.get('/docs',  serveSwaggerHtml);
app.get('/docs/', serveSwaggerHtml);

// Static swagger assets served under /docs-assets (never conflicts with HTML routes)
app.use('/docs-assets', express.static(swaggerUiPath));

// ── Serve public static assets (demo UI) ─────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Demo dashboard at /demo ───────────────────────────────────────────────────
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});


// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/crm',    crmRoutes);
app.use('/erp',    erpRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SalesLens — FP&A External Systems API running on port ${PORT}`);
  console.log(`API Key: ${API_KEY}`);
  console.log(`Endpoints: http://0.0.0.0:${PORT}/`);
});

module.exports = app;
