# Lab 2 — FP&A Variance Autopilot · Master Checklist

## Sub-Lab Build Status

| Sub-Lab | Title | Assets | README | Status |
|---------|-------|--------|--------|--------|
| [2.1](lab-02-1-add-mcp-server/README.md) | Add MCP Server & PA Tools | — | ✅ | ✅ Ready |
| [2.2](lab-02-2-import-rest-api-tools/README.md) | Import SalesLens REST API as CRM/ERP Tools | `openapi.json` ✅ | ✅ | ✅ Ready |
| [2.3](lab-02-3-pa-agent/README.md) | Create PA Agent (MCP tools only) | `lab-02-3-pa-agent/pa-data-agent.yaml` ✅ | ✅ | ✅ Ready |
| [2.4](lab-02-4-crm-erp-agents/README.md) | Create CRM + ERP Sub-Agents | `lab-02-4-crm-erp-agents/crm-agent.yaml` ✅ `erp-agent.yaml` ✅ | ✅ | ✅ Ready |
| [2.5](lab-02-5-orchestrator/README.md) | Create Orchestrator Agent | `lab-02-5-orchestrator/fpa-orchestrator-agent.yaml` ✅ | ✅ | ✅ Ready |
| [2.6](lab-02-6-chat-embed/README.md) | Optional — HTML Chat Embed | `lab-02-6-chat-embed/saleslens-crm-erp.html` ✅ | ✅ | ✅ Ready |

---

## Assets Checklist

### Infrastructure (assets/saleslens-api/)
- [x] `assets/saleslens-api/server.js` — Express entry point
- [x] `assets/saleslens-api/routes/crm.js` — CRM endpoints
- [x] `assets/saleslens-api/routes/erp.js` — ERP endpoints
- [x] `assets/saleslens-api/data/crm-data.js` — Mock deal + pipeline data
- [x] `assets/saleslens-api/data/erp-data.js` — Mock PO + headcount data
- [x] `assets/saleslens-api/openapi.json` — OpenAPI 3.0 spec (6 endpoints)
- [x] `assets/saleslens-api/Dockerfile` + `docker-compose.yml`
- [x] `assets/saleslens-api/test/smoke-test.js`

### Dataset (moved to Lab 1 — loaded into PA there)
- [x] `../lab-01-bob-planning-analytics-mcp/assets/fact_financial_data.csv`
- [x] `../lab-01-bob-planning-analytics-mcp/assets/dim_account.csv`
- [x] `../lab-01-bob-planning-analytics-mcp/assets/dim_department.csv`
- [x] `../lab-01-bob-planning-analytics-mcp/assets/dim_scenario.csv`
- [x] `../lab-01-bob-planning-analytics-mcp/assets/dim_time.csv`
- [x] `../lab-01-bob-planning-analytics-mcp/assets/dim_version.csv`

### Agent YAMLs (each co-located with its sub-lab)
- [x] `assets/fpa-variance-agent.yaml` — monolithic reference / answer key
- [x] `assets/fpa-variance-agent-reference.yaml` — flight ops reference
- [x] `lab-02-3-pa-agent/pa-data-agent.yaml` — PA MCP-only agent
- [x] `lab-02-4-crm-erp-agents/crm-agent.yaml` — CRM sub-agent
- [x] `lab-02-4-crm-erp-agents/erp-agent.yaml` — ERP sub-agent
- [x] `lab-02-5-orchestrator/fpa-orchestrator-agent.yaml` — orchestrator

### Optional
- [x] `lab-02-6-chat-embed/saleslens-crm-erp.html` — HTML chat embed (Lab 2.6)

---

## Facilitator Notes

- **Running order:** Labs must be completed in order 2.1 → 2.5. Lab 2.6 is optional and independent.
- **Dataset:** The 6 CSV files live in `lab-01-bob-planning-analytics-mcp/assets/` and are loaded into Planning Analytics during Lab 1. If participants skip Lab 1, ask your facilitator to pre-load the data.
- **Shared URL:** The SalesLens app URL must be known before starting Lab 2.2. Deploy `assets/saleslens-api/` to IBM Code Engine first (see `assets/saleslens-api/README.md`).
- **MCP credentials:** TechZone PA server URL + Basic Auth credentials must be shared before Lab 2.1.
- **Reference YAML:** `assets/fpa-variance-agent.yaml` is the answer key / monolithic version. Do not distribute to participants until after Lab 2.5.
