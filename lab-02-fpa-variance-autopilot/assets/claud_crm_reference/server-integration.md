# Wiring the dashboard into `server.js`

The dashboard is plain static files (`public/index.html`, `public/css/style.css`, `public/js/app.js`) that call the existing API from the browser — no new backend routes needed, just static file serving.

## 1. Copy the files

Drop the `public/` folder into `sample-app/`, alongside `server.js`:

```
sample-app/
├── server.js
├── public/              ← new
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── routes/
├── data/
└── test/
```

## 2. Add static serving to `server.js`

Near the top, after your existing middleware setup, add:

```js
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
```

Place this **before** your `/crm` and `/erp` route mounts if you want `/` to serve the dashboard instead of the current service-info JSON — or **after** them if you'd rather keep `/` as the JSON discovery endpoint and serve the dashboard from a dedicated path instead (see option below).

### Option A — dashboard at `/`

```js
app.use(express.static(path.join(__dirname, 'public')));
app.use('/crm', crmRoutes);
app.use('/erp', erpRoutes);
app.use('/health', healthRoutes);
// move the old "/" service-info JSON to /api-info if you still want it reachable
```

### Option B — dashboard at `/dashboard`, keep `/` as-is

```js
app.use('/dashboard', express.static(path.join(__dirname, 'public')));
```

Then open `http://localhost:8080/dashboard` (or the Code Engine URL + `/dashboard`).

## 3. CORS — only needed if the dashboard is hosted separately

Since the dashboard is served by the same Express app, no CORS changes are required. If you ever split it out as a standalone static site on a different origin, add:

```js
const cors = require('cors');
app.use('/crm', cors(), crmRoutes);
app.use('/erp', cors(), erpRoutes);
```

## 4. Using it

1. Open the dashboard URL.
2. In the sidebar, set **API base** to the app's own origin (e.g. `http://localhost:8080` locally, or the Code Engine URL in production) and **API key** to your `X-Api-Key` value. Click "Save & check health."
3. Use **Variance lookup** with a `dept_id` + `period` from the scenario table in the README (e.g. `DEPT-NA-SALES` / `2024-01`) to see the same `context_summary` text the Orchestrate agent receives.
4. Browse Deals, Pipeline, Purchase orders, and Headcount events for the raw records behind those summaries.

## Note on field names

The dashboard's table renderers assume common field names (`account_name`, `value`, `vendor`, `po_number`, `role`, `monthly_cost`, etc.) inferred from the `context_summary` examples and response shapes in the README. If your actual `data/crm-data.js` / `data/erp-data.js` use different field names, open `public/js/app.js` and adjust the `render:` functions in the `renderRows(...)` calls for `dealsFilter`, `posFilter`, and `headcountFilter` — everything else (routing, health check, variance lookup) works as-is.
