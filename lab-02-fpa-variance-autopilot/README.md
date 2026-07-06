# Lab 2 — FP&A Variance Autopilot

**Duration:** 90 minutes  
**Tools:** watsonx Orchestrate · IBM Planning Analytics · SalesLens Mock API  
**Prerequisite:** [Lab 0](../lab-00-setup/README.md) ✅ and [Lab 1](../lab-01-bob-planning-analytics-mcp/README.md) ✅ completed

---

## Overview

Your FP&A team currently spends **3–4 days each month** manually investigating budget variances across dozens of cost centres — cross-referencing Planning Analytics data with CRM pipeline reports and ERP operational data. By the time root causes are identified, the window for corrective action has often closed.

**In this lab you will build the FP&A Variance Autopilot** — a watsonx Orchestrate agent that:

1. **Detects** material budget variances in Planning Analytics (>$100K or >20%)
2. **Calls the SalesLens CRM/ERP API** to enrich each variance with real business context
3. **Generates** a plain-language CFO-ready explanation for every variance
4. **Routes alerts** to the right stakeholders based on severity

Time to complete the same workflow: **under 5 minutes**.

---

## What You Will Do

| Exercise | Task | Time |
|----------|------|------|
| [Exercise 1](#exercise-1--quick-catch-up-on-the-fpa-dataset) | Quick catch-up — confirm data from Lab 1 | 10 min |
| [Exercise 2](#exercise-2--connect-planning-analytics-mcp-to-orchestrate) | Connect Planning Analytics MCP to Orchestrate | 15 min |
| [Exercise 3](#exercise-3--create-the-fpa-agent--add-tools) | Create the agent + add MCP & REST API tools | 20 min |
| [Exercise 4](#exercise-4--run-the-end-to-end-autopilot-flow) | Run the end-to-end autopilot flow | 15 min |
| [Exercise 5](#exercise-5--agentops--evaluation) | AgentOps — trace, evaluate, and improve | 15 min |
| [Exercise 6](#exercise-6--connect-via-watsonx-orchestrate-adk) | Connect using watsonx Orchestrate ADK | 15 min |

---

## The SalesLens Mock API (External Systems)

The **SalesLens** app is a live REST API deployed for this workshop. It simulates the CRM and ERP systems your agent will query to explain variances.

| System | Base Path | Primary Agent Endpoint | What It Returns |
|--------|-----------|------------------------|-----------------|
| CRM | `/crm` | `GET /crm/variance-context` | Slipped deals, pipeline coverage, context summary |
| ERP | `/erp` | `GET /erp/cost-context` | Unbudgeted POs, headcount events, cost context summary |

**API Key:** `workshop-demo-key` (header: `X-Api-Key`)  
**Demo UI:** `<YOUR_APP_URL>/demo` — Variance Lookup, Deals, POs, Headcount  
**Swagger:** `<YOUR_APP_URL>/docs` — try every endpoint live  
**OpenAPI spec:** `<YOUR_APP_URL>/api-spec` — used to import into Orchestrate

> Your facilitator will provide the deployed app URL. For local testing: `http://localhost:8080`

---

## Exercise 1 — Quick Catch-up on the FPA Dataset

> **If you completed Lab 1 Exercise 5**, the `FPA_Variance` cube is already loaded on your TechZone server — run Step 1.2 to confirm and move on. **Total time: 5 minutes.**

### Step 1.1 — Confirm the Cube Exists

In Bob (Planning Analytics mode), send:

```
List available cubes on the DemoGuide server.
Show me the dimensions of the FPA_Variance cube.
```

**Expected:** `FPA_Variance` cube with dimensions: Account, Department, Scenario, Time, Version.

> If the cube is not present, ask your facilitator — it can be pre-loaded, or re-run Lab 1 Exercise 5 in 8 minutes.

---

### Step 1.2 — Spot-Check the Variance Data

```
Show me January 2024 actual vs budget for all departments in FPA_Variance.
Flag any variance greater than $100,000 or 20%.
```

You should see the key variances this lab is built around:

| Department | Account | Budget | Actual | Variance |
|-----------|---------|--------|--------|---------|
| NA Sales | Enterprise Software Revenue | $500K | $325K | **-$175K (-35%) 🔴** |
| NA Sales | Sales & Marketing OpEx | $120K | $145K | **+$25K (+20.8%) 🟡** |
| EMEA Sales | Enterprise Software Revenue | $380K | $420K | +$40K (+10.5%) ✅ |

These are the variances the autopilot will investigate in Exercises 3–4.

---

## Exercise 2 — Connect Planning Analytics MCP to Orchestrate

**Goal:** Register the Planning Analytics MCP server as a tool source in watsonx Orchestrate so your agent can query TM1 directly.

### Step 2.1 — Open Orchestrate and Navigate to Integrations

1. Log in to your **watsonx Orchestrate** tenant.
2. In the left navigation, click **Integrations** (or **Tools** → **Connections** depending on your version).
3. Click **Add integration** → **MCP Server**.

---

### Step 2.2 — Enter the MCP Connection Details

| Field | Value |
|-------|-------|
| **Name** | `planning-analytics-mcp` |
| **MCP Server URL** | `http://<TECHZONE_HOST>:<PORT>/api/<TENANT_ID>/v0/agentic-ai/cube/mcp` |
| **Transport** | `streamable-http` (or `sse` if your version requires) |
| **Authentication** | Basic Auth — Base64 encoded `user:password` |
| **Authorization Header** | `Authorization: Basic <base64>` |

> Your facilitator will provide the exact MCP URL and credentials for the TechZone server.

Click **Test connection** → you should see a green tick and a list of available tools.

---

### Step 2.3 — Verify Tools Are Available

After connecting, Orchestrate will discover all tools exposed by the MCP server. Confirm these are present:

```
get_available_tm1_servers
list_cubes_with_ai_analysis_metadata
get_cube_dimensions
get_data_from_data_explorer
execute_mdx_and_get_view
perform_outlier_detection
get_outlier_summary
```

> **Tip:** Click any tool to see its input/output schema — this is what the agent sees when it decides which tool to call.

---

### Step 2.4 — Add the SalesLens REST API as a Tool Source

Now register the CRM/ERP mock API the same way — using its OpenAPI spec.

1. Click **Add integration** → **REST API / OpenAPI**.
2. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `saleslens-fpa-api` |
| **OpenAPI spec URL** | `<YOUR_APP_URL>/api-spec` |
| **Authentication type** | API Key |
| **Header name** | `X-Api-Key` |
| **API Key value** | `workshop-demo-key` |

3. Click **Import** — Orchestrate reads the spec and creates individual tools for every endpoint.

**Confirm these tools were created:**

| Tool name (from spec) | Endpoint |
|-----------------------|----------|
| `getCrmVarianceContext` | `GET /crm/variance-context` |
| `getCrmDeals` | `GET /crm/deals` |
| `getCrmPipelineSummary` | `GET /crm/pipeline-summary` |
| `getErpCostContext` | `GET /erp/cost-context` |
| `getErpPurchaseOrders` | `GET /erp/purchase-orders` |
| `getErpHeadcountEvents` | `GET /erp/headcount-events` |

> **What just happened:** Orchestrate parsed the OpenAPI spec from `<YOUR_APP_URL>/api-spec`, auto-generated tool schemas from each path, and wired the API key credential. The agent can now call CRM and ERP endpoints exactly like it calls PA MCP tools.

---

### Step 2.5 — Try a Tool Call Manually

Before wiring tools to an agent, test the connection directly from the Tools panel:

1. Click on `getCrmVarianceContext`.
2. In the **Try it** panel, enter:
   - `dept_id`: `DEPT-NA-SALES`
   - `period`: `2024-01`
3. Click **Run**.

**Expected response:**
```json
{
  "context_summary": "2 deal(s) totalling $200K slipped: Acme Corp ($120K), TechStart Inc ($80K)...",
  "total_slipped_value": 200000,
  "slipped_deals": [ ... ]
}
```

The `context_summary` field is the ready-made root cause narrative the agent will embed directly in its variance report.

---

## Exercise 3 — Create the FP&A Agent & Add Tools

**Goal:** Build the FP&A Variance Autopilot agent, wire it to both the PA MCP tools and the SalesLens API tools, and configure its instructions.

### Step 3.1 — Create the Agent

1. In Orchestrate, navigate to **Agents** → **Create agent**.
2. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `FP&A Variance Autopilot` |
| **Description** | Detects material budget variances in Planning Analytics, queries CRM and ERP for root cause context, generates CFO-ready explanations and stakeholder alerts |
| **Model** | `ibm/granite-3-3-8b-instruct` (or your tenant default) |

---

### Step 3.2 — Import Instructions from YAML

Rather than typing instructions manually, import from the pre-built agent definition:

1. Click **Import from YAML** (or **Advanced** → **YAML editor**).
2. Open `lab-02-fpa-variance-autopilot/assets/fpa-variance-agent.yaml` from this repository.
3. Paste the full YAML content and click **Apply** or **Save**.

> The YAML contains the complete agent persona, reasoning chain, variance thresholds, root cause logic, alert routing rules, and response format.

**Key instruction sections to review after import:**

```
Material variance thresholds:
  Revenue (REV-*):  > $100,000 or > 20%
  OpEx (OPEX-*):    > $50,000  or > 15%

Root cause logic:
  Revenue variance → call getCrmVarianceContext → embed context_summary
  OpEx variance    → call getErpCostContext     → embed context_summary

Severity routing:
  HIGH   → Regional VP (email, immediate)
  MEDIUM → FP&A Manager (dashboard)
  LOW    → FP&A team (monthly digest)
```

---

### Step 3.3 — Add Planning Analytics MCP Tools

1. In the agent editor, go to the **Tools** tab.
2. Click **Add tools** → select **From integration** → pick `planning-analytics-mcp`.
3. Enable these specific tools:

```
✅ get_available_tm1_servers
✅ list_cubes_with_ai_analysis_metadata
✅ get_cube_dimensions
✅ get_cube_sample_members
✅ get_data_from_data_explorer
✅ execute_mdx_and_get_view
✅ lookup_potential_members
✅ perform_outlier_detection
✅ get_outlier_summary
```

4. Click **Save**.

---

### Step 3.4 — Add SalesLens CRM/ERP Tools

1. Still in the **Tools** tab, click **Add tools** → **From integration** → pick `saleslens-fpa-api`.
2. Enable these tools:

```
✅ getCrmVarianceContext      ← primary revenue root cause
✅ getCrmDeals
✅ getCrmPipelineSummary
✅ getErpCostContext          ← primary opex root cause
✅ getErpPurchaseOrders
✅ getErpHeadcountEvents
```

3. Click **Save**.

**Your agent now has tools across two systems:**
```
┌─────────────────────────────────────┐
│     FP&A Variance Autopilot         │
│                                     │
│  Planning Analytics MCP  (9 tools)  │  ← TM1 data
│  SalesLens REST API      (6 tools)  │  ← CRM + ERP context
└─────────────────────────────────────┘
```

---

### Step 3.5 — Preview the Tool Schema

Click `getCrmVarianceContext` in the tools list. Notice how Orchestrate surfaced the tool from the OpenAPI spec:

| Property | Value |
|----------|-------|
| **operationId** | `getCrmVarianceContext` |
| **Description** | *"Returns slipped deals and pipeline context..."* |
| **Parameters** | `dept_id` (required), `period` (required), `account_id` (optional) |
| **Response** | `context_summary`, `slipped_deals[]`, `pipeline_summary` |

> **Discussion:** The agent uses the `description` field to decide *when* to call this tool. Good API descriptions directly improve agent reasoning quality — this is why the OpenAPI spec documentation matters.

---

## Exercise 4 — Run the End-to-End Autopilot Flow

**Goal:** Trigger the agent and observe it orchestrating PA MCP + SalesLens API calls to produce a variance report.

### Step 4.1 — Open the Agent Chat

In the agent editor, click **Preview** or **Test agent**. You will see the Orchestrate agent chat interface.

---

### Step 4.2 — Trigger the Autopilot

Send this prompt:

```
Run the FP&A variance analysis for January 2024 on the FPA_Variance cube
on the DemoGuide server. Identify all material variances, investigate root
causes using the CRM and ERP systems, and generate a full variance report.
```

**Watch the tool call trace** in the Orchestrate UI (visible in the side panel or logs):

```
Step 1 → get_available_tm1_servers
Step 2 → list_cubes_with_ai_analysis_metadata
Step 3 → get_cube_dimensions
Step 4 → get_data_from_data_explorer   (or execute_mdx_and_get_view)
Step 5 → getCrmVarianceContext          dept_id=DEPT-NA-SALES, period=2024-01
Step 6 → getErpCostContext              dept_id=DEPT-NA-SALES, period=2024-01
Step 7 → [synthesise report]
```

This is the agent autonomously deciding which tool to call, in which order, based on what it discovers — not a scripted workflow.

---

### Step 4.3 — Review the Output

The agent should produce a structured report:

```
📊 FP&A Variance Analysis — January 2024

Server: DemoGuide | Cube: FPA_Variance | Period: 2024-01

MATERIAL VARIANCES DETECTED: 2

─────────────────────────────────────────────────────────
🔴 HIGH — NA Sales | Enterprise Software Revenue
─────────────────────────────────────────────────────────
  Budget: $500,000 | Actual: $325,000
  Variance: -$175,000 (-35.0%) ← Unfavorable

  Root Cause: Two enterprise deals totalling $200K slipped
  from January to February. Acme Corp ($120K) delayed by
  procurement process; TechStart Inc ($80K) impacted by
  customer budget freeze. Both remain in pipeline with
  high close probability. [source: CRM /variance-context]

  Classification: Timing-related slippage
  Forecast Action: None required — deals expected Feb
  CRM Action: Confirm close dates for Acme + TechStart

─────────────────────────────────────────────────────────
🟡 MEDIUM — NA Sales | Sales & Marketing OpEx
─────────────────────────────────────────────────────────
  Budget: $120,000 | Actual: $145,000
  Variance: +$25,000 (+20.8%) ← Unfavorable

  Root Cause: Unplanned trade show ($18K unbudgeted PO,
  vendor: TechWorld Events) + December new hire carrying
  into January ($8.5K/mo). [source: ERP /cost-context]

  Classification: Controllable overspend
  Forecast Action: +$15K Q1 OpEx adjustment recommended

─────────────────────────────────────────────────────────
✅ FAVORABLE — EMEA Sales | Enterprise Software Revenue
  +$40,000 (+10.5%) — Early close of GlobalTech deal.

─────────────────────────────────────────────────────────
SUMMARY
  Revenue Variance (Net):  -$135,000 (-8.8% vs budget)
  OpEx Variance (Net):     +$25,000  (+7.5% vs budget)
  Material Variances: 2 (1 High, 1 Medium)
  Coverage: 100% of material variances explained

RECOMMENDED ACTIONS:
  1. [HIGH] Confirm Feb close — Acme Corp + TechStart
  2. [MEDIUM] Review NA Sales OpEx run-rate vs Q1 plan
  3. [LOW] Document EMEA early close in pipeline report

Confidence: 0.92 | Alerts: VP Sales (email), FP&A Mgr (dashboard)
```

---

### Step 4.4 — Run the SalesLens UI Side-by-Side

Open `<YOUR_APP_URL>/demo` in a browser tab. Go to **Variance Lookup** and enter the same parameters:

- **Department:** `DEPT-NA-SALES`
- **Period:** `2024-01`

Click **Fetch context**. You will see exactly the same `context_summary` strings the agent used — this is what the Orchestrate agent called under the hood via `getCrmVarianceContext` and `getErpCostContext`.

> **Key insight for participants:** The agent is not hallucinating root causes — it is reading them directly from a live REST API. This is the pattern for any real implementation: your CRM (Salesforce, HubSpot) or ERP (SAP, Oracle) exposes an endpoint; the agent calls it.

---

### Step 4.5 — Try Another Period

```
Run the variance analysis for March 2024. Focus on APAC Sales variances.
```

March 2024 surfaces a -$85K APAC variance (regulatory approval delay in China). The agent calls `getCrmVarianceContext?dept_id=DEPT-APAC-SALES&period=2024-03` and returns the correct root cause.

---

## Exercise 5 — AgentOps: Evaluation & Tracing

**Goal:** Use Orchestrate's built-in AgentOps capabilities to trace agent execution, evaluate output quality, and understand how to improve agent behaviour.

### Step 5.1 — View the Execution Trace

After running the autopilot in Exercise 4:

1. In Orchestrate, navigate to **AgentOps** → **Traces** (or **Logs** → **Agent runs**).
2. Find your most recent run and click into it.

You will see the full execution trace:

```
Run ID: run-a3f9...
Start: 14:23:01  |  End: 14:23:07  |  Duration: 6.1s

┌─ Reasoning step 1 ──────────────────────────────────────┐
│ Input: "Run FP&A variance analysis for January 2024..."  │
│ Decision: Need to identify available TM1 servers first   │
│ Tool called: get_available_tm1_servers                   │
│ Result: ["DemoGuide"]                                    │
└──────────────────────────────────────────────────────────┘
┌─ Reasoning step 2 ──────────────────────────────────────┐
│ Decision: Check if FPA_Variance is pre-analyzed          │
│ Tool called: list_cubes_with_ai_analysis_metadata        │
│ Result: FPA_Variance is_analyzed: true                   │
└──────────────────────────────────────────────────────────┘
... (continue through all steps)
```

**What to observe:**
- How many reasoning steps did the agent take?
- Which tools were called and in what order?
- Where did the agent use PA MCP vs SalesLens API?
- Token usage per step

---

### Step 5.2 — Evaluate Output Quality

Orchestrate AgentOps includes built-in evaluation metrics. Navigate to **AgentOps** → **Evaluations** and review:

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| **Faithfulness** | Are the root causes grounded in actual tool responses? | > 0.85 |
| **Completeness** | Were all material variances addressed? | 1.0 |
| **Tool precision** | Did the agent call the right tool at the right time? | > 0.90 |
| **Response format** | Did the output follow the defined structure? | Pass |

> **Discussion:** If faithfulness scores low, the agent may be embellishing beyond what the API returned. Review the agent instructions — add `"Only use root cause text directly from context_summary. Do not infer."` to constrain this.

---

### Step 5.3 — Run a Comparison Evaluation

Orchestrate allows you to test the same prompt against two agent configurations side-by-side:

1. Navigate to **AgentOps** → **Comparisons**.
2. Create a comparison:
   - **Agent A:** Current agent (with both PA MCP + SalesLens tools)
   - **Agent B:** Same agent with SalesLens tools **disabled**
3. Run the same January 2024 prompt against both.
4. Review: how does root cause quality change when the agent can't query external systems?

**Expected finding:** Agent B falls back to generic explanations or the `variance_explanation` field in the cube data. Agent A references specific deal names, vendor names, and PO amounts — much higher business value.

---

### Step 5.4 — Improve Agent Instructions Based on Trace

Based on your trace review, try one instruction improvement. For example, if the agent skipped the ERP check on an OpEx variance, add to the instructions:

```
IMPORTANT: For every material OpEx or COGS variance you must call
getErpCostContext before generating the explanation. Never skip this step.
```

Re-run the evaluation and compare the faithfulness score.

---

## Exercise 6 — Connect via watsonx Orchestrate ADK

**Goal:** Use the **watsonx Orchestrate ADK** (Agent Development Kit) to programmatically define tools, connect the SalesLens API, and register the agent — all from code rather than the UI.

### Background: Why ADK?

The ADK is the developer path for:
- Embedding agent creation in CI/CD pipelines
- Registering custom tools that aren't exposed via OpenAPI
- Building multi-agent systems programmatically
- Testing agents locally before deploying to Orchestrate

---

### Step 6.1 — Install the ADK

```bash
pip install ibm-watsonx-orchestrate
```

Verify:

```bash
orchestrate --version
```

---

### Step 6.2 — Authenticate

```bash
orchestrate env add --env-name workshop \
  --url https://<YOUR_ORCHESTRATE_TENANT>.ai.ibm.com \
  --api-key <YOUR_API_KEY>

orchestrate env activate workshop
```

---

### Step 6.3 — Import the SalesLens API as a Toolset

The ADK can import any OpenAPI spec directly as a named toolset:

```bash
orchestrate tools import \
  --kind openapi \
  --spec https://<YOUR_APP_URL>/api-spec \
  --name saleslens-fpa-api \
  --app-id saleslens
```

Set the API key credential:

```bash
orchestrate credentials add \
  --app-id saleslens \
  --header X-Api-Key \
  --value workshop-demo-key
```

Verify tools were imported:

```bash
orchestrate tools list | grep saleslens
```

**Expected output:**
```
saleslens/getCrmVarianceContext
saleslens/getCrmDeals
saleslens/getCrmPipelineSummary
saleslens/getErpCostContext
saleslens/getErpPurchaseOrders
saleslens/getErpHeadcountEvents
```

---

### Step 6.4 — Import the MCP Server via ADK

```bash
orchestrate tools import \
  --kind mcp \
  --url http://<TECHZONE_HOST>:<PORT>/api/<TENANT_ID>/v0/agentic-ai/cube/mcp \
  --name planning-analytics-mcp \
  --auth-type basic \
  --username <USER> \
  --password <PASSWORD>
```

---

### Step 6.5 — Deploy the Agent from YAML

The `fpa-variance-agent.yaml` in this repo is already ADK-compatible. Deploy it directly:

```bash
orchestrate agents import \
  --file lab-02-fpa-variance-autopilot/assets/fpa-variance-agent.yaml
```

Verify:

```bash
orchestrate agents list
```

**Expected:**
```
fpa_variance_autopilot    FP&A Variance Autopilot    active
```

---

### Step 6.6 — Chat with the Agent via CLI

```bash
orchestrate agents chat --agent fpa_variance_autopilot
```

```
You: Run the variance analysis for January 2024 on FPA_Variance cube.

Agent: 📊 FP&A Variance Analysis — January 2024 ...
```

---

### Step 6.7 — Call the Agent via REST API

Every Orchestrate agent exposes a REST endpoint. Use this in your own applications:

```bash
curl -X POST \
  https://<YOUR_ORCHESTRATE_TENANT>.ai.ibm.com/v1/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "fpa_variance_autopilot",
    "messages": [{
      "role": "user",
      "content": "Run variance analysis for January 2024 on FPA_Variance cube"
    }]
  }'
```

> **Production pattern:** This is how you would trigger the autopilot from a Planning Analytics TurboIntegrator process, a scheduler, or a Power Automate flow — the moment actuals land in TM1, call this endpoint.

---

## Architecture: How the Autopilot Works

```
User / Scheduler / TM1 Event
           │
           ▼
  ┌─────────────────────────────────────────┐
  │        watsonx Orchestrate               │
  │   FP&A Variance Autopilot Agent          │
  │                                          │
  │  ┌──────────────┐  ┌──────────────────┐  │
  │  │ PA MCP Tools │  │ SalesLens REST   │  │
  │  │  (9 tools)   │  │  API (6 tools)   │  │
  │  └──────┬───────┘  └────────┬─────────┘  │
  └─────────┼───────────────────┼────────────┘
            │                   │
            ▼                   ▼
  ┌──────────────────┐  ┌────────────────────┐
  │ IBM Planning     │  │  SalesLens Mock     │
  │ Analytics (TM1)  │  │  ┌─────┐ ┌─────┐  │
  │                  │  │  │ CRM │ │ ERP │  │
  │ FPA_Variance     │  │  └─────┘ └─────┘  │
  │ cube             │  │  /crm/variance-    │
  │ (Budget/Actual)  │  │  context           │
  └──────────────────┘  │  /erp/cost-context │
                        └────────────────────┘
            │                   │
            └─────────┬─────────┘
                      ▼
           ┌─────────────────────┐
           │  AI Explanation     │
           │  + Stakeholder      │
           │  Alert Routing      │
           └─────────────────────┘
```

---

## Business Value Summary

| Metric | Manual Process | With Autopilot |
|--------|---------------|----------------|
| Time to investigate variances | 3–4 days | < 5 minutes |
| Coverage (% explained) | ~60% | 100% |
| Stakeholder notification | Day 3–4 of close | Immediate |
| CRM/ERP cross-reference | Manual lookup | Automatic |
| Audit trail in PA | Manual, inconsistent | Automatic, timestamped |

---

## Troubleshooting

### MCP connection fails in Orchestrate
Verify the URL format and that Basic Auth credentials are correct. Test the URL directly in a browser — you should see a JSON response from the MCP server.

### SalesLens API import fails
Ensure the app is running and the `/api-spec` endpoint returns valid JSON. Open `<YOUR_APP_URL>/api-spec` in a browser to confirm. Check that the API key header is set to `X-Api-Key`.

### Agent returns no CRM/ERP context
Check that the `dept_id` and `period` values match exactly what's in the data. Valid dept IDs: `DEPT-NA-SALES`, `DEPT-EMEA-SALES`, `DEPT-APAC-SALES`, `DEPT-LATAM-SALES`. Valid periods: `2024-01` through `2024-06`.

### YAML import fails in Orchestrate UI
Some tenants require the agent to be created manually. Refer to Appendix A for the key fields and use the ADK import path in Exercise 6 as an alternative.

### ADK authentication fails
Ensure your API key has the `Agent Developer` role in the Orchestrate tenant. Run `orchestrate env list` to verify the active environment.

---

## Appendix A — Agent Configuration Reference

| Field | Value |
|-------|-------|
| **Name** | `FP&A Variance Autopilot` |
| **Model** | `ibm/granite-3-3-8b-instruct` |
| **Revenue threshold** | > $100,000 or > 20% |
| **OpEx threshold** | > $50,000 or > 15% |
| **HIGH severity** | > 25% or > $150,000 |
| **MEDIUM severity** | 15–25% or $75K–$150K |
| **LOW severity** | 10–15% or $25K–$75K |
| **PA MCP tools** | 9 (see Exercise 3.3) |
| **SalesLens tools** | 6 (see Exercise 3.4) |

---

## Appendix B — SalesLens API Quick Reference

| Endpoint | Parameters | Agent Use |
|----------|-----------|-----------|
| `GET /crm/variance-context` | `dept_id`, `period`, `account_id?` | Revenue variance root cause |
| `GET /crm/deals` | `dept_id?`, `period?`, `status?` | Individual deal lookup |
| `GET /crm/pipeline-summary` | `dept_id`, `period` | Coverage ratio check |
| `GET /erp/cost-context` | `dept_id`, `period`, `account_id?` | OpEx variance root cause |
| `GET /erp/purchase-orders` | `dept_id?`, `period?` | PO detail lookup |
| `GET /erp/headcount-events` | `dept_id?`, `period?` | Headcount cost detail |

---

## What's Next

Continue to **Lab 3: Adapt to Your Own Use Case** →

[→ Go to Lab 3](../lab-03-bring-your-own-usecase/README.md)
