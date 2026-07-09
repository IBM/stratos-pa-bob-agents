# Lab 2.2 — Import SalesLens REST API as CRM & ERP Tools

**Duration:** 15 minutes  
**Prerequisite:** Lab 2.1 ✅ (PA MCP tools added to the agent)  
**IBM Docs:** [Import tools from an OpenAPI](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=tools-importing-from-openapi)

---

## Goal

Import the SalesLens OpenAPI spec into watsonx Orchestrate to auto-generate 6 CRM and ERP tools, attach them to the agent, and validate with a live call.

> **UI note:** Tools are imported via **Build → All agents → agent → Toolset → Add tool → OpenAPI**. The OpenAPI spec is uploaded as a file (drag and drop) — not via URL. Download the spec first as described in Step 1.

By the end of this lab you will have:
- 3 CRM tools added to the agent's toolset (`getCrmVarianceContext`, `getCrmDeals`, `getCrmPipelineSummary`)
- 3 ERP tools added to the agent's toolset (`getErpCostContext`, `getErpPurchaseOrders`, `getErpHeadcountEvents`)
- A live `getCrmVarianceContext` call returning a root cause narrative

---

## Background — The SalesLens Mock API

SalesLens is a Node.js/Express REST API that simulates the CRM and ERP systems your agent will query to explain Planning Analytics variances.

| System | Base path | Primary endpoint | Returns |
|--------|-----------|-----------------|---------|
| CRM | `/crm` | `GET /crm/variance-context` | Deal slippage, pipeline coverage, root cause narrative |
| ERP | `/erp` | `GET /erp/cost-context` | Unbudgeted POs, headcount events, cost narrative |

**Connection details (from your facilitator):**

| | Value |
|-|-------|
| **App URL** | `https://<YOUR_APP_URL>` (Code Engine) or `http://localhost:8080` (local) |
| **API Key** | `workshop-demo-key` |
| **Header** | `X-Api-Key` |
| **OpenAPI spec** | `<APP_URL>/api-spec` |
| **Swagger UI** | `<APP_URL>/docs` |
| **Demo UI** | `<APP_URL>/demo` |

---

## Step 1 — Download the OpenAPI Spec File

The Orchestrate UI requires a **file upload** for OpenAPI specs. Download the spec from the running SalesLens app first:

```bash
curl -o saleslens-openapi.json <APP_URL>/api-spec
```

Or open `<APP_URL>/api-spec` in a browser and save the JSON file to your desktop.

> **Verify the app is running first:**
> ```bash
> curl <APP_URL>/health
> # Expected: {"status":"ok","service":"fpa-external-systems-mock","version":"1.0.0"}
> ```

---

## Step 2 — Open the Agent in Build

1. From the watsonx Orchestrate navigation menu, click **Build**.
2. For IBM Cloud environments, select your workspace.
3. Click **All agents** → select your agent.

---

## Step 3 — Import the CRM Tools via OpenAPI

1. In the **Toolset** section, click **Add tool**.
2. Click **OpenAPI**.
3. **Drag and drop** `saleslens-openapi.json` into the upload area (or click to browse).
4. After the file uploads, click **Next**.
5. In the operations list, select the **3 CRM operations**:

```
✅ getCrmVarianceContext     GET /crm/variance-context
✅ getCrmDeals               GET /crm/deals
✅ getCrmPipelineSummary     GET /crm/pipeline-summary
```

   Deselect all ERP operations for now — you will import those separately in Step 4.

6. Click **Next**.
7. **Associate a connection** for the API key:
   - Click **Add new connection**.
   - In the **Add new connection** window:

| Field | Value |
|-------|-------|
| **Connection name** | `saleslens-crm-key` |
| **Authentication type** | API Key |
| **Header name** | `X-Api-Key` |
| **API Key value** | `workshop-demo-key` |

   - Click **Save**.
   - Select `saleslens-crm-key` as the connection for these tools.

8. Click **Done**.

The 3 CRM tools now appear in the agent's Toolset.

> **Why import CRM and ERP separately?** In Lab 2.4 you will create a dedicated CRM Agent and a dedicated ERP Agent, each with only their relevant tools. Keeping them as separate imports makes tool assignment cleaner.

---

## Step 4 — Import the ERP Tools via OpenAPI

Repeat the import for the ERP operations using the **same spec file**:

1. **Toolset** → **Add tool** → **OpenAPI**.
2. Upload `saleslens-openapi.json` again (or drag the same file).
3. Click **Next**.
4. This time select the **3 ERP operations**:

```
✅ getErpCostContext         GET /erp/cost-context
✅ getErpPurchaseOrders      GET /erp/purchase-orders
✅ getErpHeadcountEvents     GET /erp/headcount-events
```

   Deselect all CRM operations.

5. Click **Next**.
6. **Associate a connection**:
   - Click **Add new connection**.

| Field | Value |
|-------|-------|
| **Connection name** | `saleslens-erp-key` |
| **Authentication type** | API Key |
| **Header name** | `X-Api-Key` |
| **API Key value** | `workshop-demo-key` |

   - Click **Save** and select `saleslens-erp-key`.

7. Click **Done**.

---

## Step 5 — Verify All 6 Tools Are in the Toolset

In the **Toolset** section, confirm all 6 tools are listed:

| Tool | Source | Endpoint |
|------|--------|----------|
| `getCrmVarianceContext` | OpenAPI import | `GET /crm/variance-context` |
| `getCrmDeals` | OpenAPI import | `GET /crm/deals` |
| `getCrmPipelineSummary` | OpenAPI import | `GET /crm/pipeline-summary` |
| `getErpCostContext` | OpenAPI import | `GET /erp/cost-context` |
| `getErpPurchaseOrders` | OpenAPI import | `GET /erp/purchase-orders` |
| `getErpHeadcountEvents` | OpenAPI import | `GET /erp/headcount-events` |

> **Update tool descriptions (recommended):** Click a tool's menu → **Edit details**. The agent uses the description to decide *when and how* to call the tool. The default descriptions from the OpenAPI spec are already good — but you can sharpen them. For example for `getCrmVarianceContext`: *"Call this tool for any Revenue variance (REV-*) to get CRM deal slippage context and pipeline coverage. Returns a ready-made context_summary narrative."*

---

## Step 6 — Test Live Tool Calls from Preview

### CRM test

In the agent **Preview** panel, send:

```
Get CRM variance context for DEPT-NA-SALES in January 2024.
```

**Expected tool call:**
```
→ getCrmVarianceContext   dept_id=DEPT-NA-SALES, period=2024-01
```

**Expected response includes:**
```json
{
  "context_summary": "2 deal(s) totalling $200K slipped from 2024-01: Acme Corp ($120K — customer procurement delayed); TechStart ($80K — budget freeze)...",
  "total_slipped_value": 200000
}
```

### ERP test

```
Get ERP cost context for DEPT-NA-SALES in January 2024.
```

**Expected tool call:**
```
→ getErpCostContext   dept_id=DEPT-NA-SALES, period=2024-01
```

**Expected response includes:**
```json
{
  "context_summary": "1 unbudgeted purchase order(s) totalling $18K: TechWorld Events LLC — Events & Conferences. 1 unbudgeted headcount event(s) adding $8K/month: Enterprise Account Executive (new_hire).",
  "total_unplanned_cost": 26000
}
```

The `context_summary` in both responses is the ready-made root cause narrative that the CRM and ERP agents (Lab 2.4) will pass to the orchestrator.

---

## Step 7 — Explore the Demo UI (Optional)

Open `<APP_URL>/demo` in a browser → **Variance Lookup** → enter `DEPT-NA-SALES` / `2024-01` → **Fetch context**.

You will see the same `context_summary` strings — this is exactly what the agent called under the hood. The agent is grounded in live API data, not model-generated text.

---

## ✅ Checkpoint

- [ ] `saleslens-openapi.json` downloaded from `<APP_URL>/api-spec`
- [ ] 3 CRM tools imported and visible in the agent Toolset
- [ ] 3 ERP tools imported and visible in the agent Toolset
- [ ] `saleslens-crm-key` and `saleslens-erp-key` connections saved
- [ ] `getCrmVarianceContext` returns `context_summary` with 2 slipped deals from Preview
- [ ] `getErpCostContext` returns `context_summary` with PO + headcount from Preview

---

## ADK Alternative

```bash
# Import CRM tools
orchestrate tools import \
  --kind openapi \
  --spec ./saleslens-openapi.json \
  --name saleslens-crm \
  --app-id saleslens-crm

orchestrate credentials add \
  --app-id saleslens-crm \
  --header X-Api-Key \
  --value workshop-demo-key

# Import ERP tools
orchestrate tools import \
  --kind openapi \
  --spec ./saleslens-openapi.json \
  --name saleslens-erp \
  --app-id saleslens-erp

orchestrate credentials add \
  --app-id saleslens-erp \
  --header X-Api-Key \
  --value workshop-demo-key

# Verify
orchestrate tools list | grep saleslens
```

---

## Troubleshooting

**App URL not reachable / health check fails**  
→ Confirm the SalesLens app is deployed and running. For local: `npm start` in `assets/saleslens-api/`. For Code Engine: `ibmcloud ce application get --name fpa-mock-api --output url`.

**File upload fails or no operations appear**  
→ Verify `saleslens-openapi.json` is valid JSON: `python3 -m json.tool saleslens-openapi.json`.  
→ If the spec was saved from a browser, check for HTML wrapping — the file must start with `{`.

**Only some operations appear in the list**  
→ Orchestrate imports all `GET` and `POST` operations from the spec. Ensure the spec version is OpenAPI 3.0.x (not 2.x Swagger).

**401 Unauthorized when the agent calls a tool**  
→ The connection was not associated with the tools. Open each tool → **Edit details** → check the connection is set to `saleslens-crm-key` or `saleslens-erp-key`.  
→ The header name must be exactly `X-Api-Key` — uppercase X, A, and K.

**`getCrmVarianceContext` returns empty `slipped_deals`**  
→ Valid dept IDs: `DEPT-NA-SALES`, `DEPT-EMEA-SALES`, `DEPT-APAC-SALES`, `DEPT-LATAM-SALES`  
→ Valid period format: `2024-01` (not `January 2024`). Test at `<APP_URL>/docs` to rule out a tool config issue.

---

## Next

→ **[Lab 2.3 — Create the PA Data Agent](../lab-02-3-pa-agent/README.md)**
