# Lab 2.4 — Create the CRM Agent & ERP Agent

**Duration:** 20 minutes  
**Prerequisite:** Lab 2.2 ✅ (SalesLens tools imported)  
**Reference:** [developer.watson-orchestrate.ibm.com](https://developer.watson-orchestrate.ibm.com)

---

## Goal

Build two focused sub-agents — one for CRM deal context and one for ERP cost context — each using only their relevant SalesLens tools. Test each independently before wiring them to the orchestrator in Lab 2.5.

By the end of this lab you will have:
- `CRM Context Agent` active in Orchestrate — 3 CRM tools, revenue root cause
- `ERP Context Agent` active in Orchestrate — 3 ERP tools, OpEx root cause
- Both agents returning structured `context_summary` narratives

---

## Background — Why Two Separate Agents?

| Single CRM+ERP agent | Two separate agents |
|---------------------|---------------------|
| All 6 tools in one agent | 3 tools each — focused context |
| Model must decide CRM vs ERP on every call | Orchestrator routes by account type — no ambiguity |
| Harder to evaluate and iterate independently | Each agent can be tested, improved, swapped |
| One failure affects both systems | Isolated failure modes |

The orchestrator in Lab 2.5 routes to the right agent based on account type (`REV-*` → CRM, `OPEX-*`/`COGS-*` → ERP). This is the recommended multi-agent pattern for Orchestrate.

---

## Part A — CRM Context Agent

### Step A1 — Create the Agent

**Option A — Orchestrate UI:**

1. Navigate to **Agents** → **Create agent**.
2. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `CRM Context Agent` |
| **Description** | Queries the SalesLens CRM API for deal slippage and pipeline context. Returns root cause narratives for revenue variances. Does not query Planning Analytics or ERP. |
| **Model** | `ibm/granite-3-3-8b-instruct` (or tenant default) |

**Option B — ADK:**

```bash
orchestrate agents import \
  --file ./crm-agent.yaml
```

---

### Step A2 — Import CRM Agent Instructions

1. In the agent editor → **Instructions** tab → **Import from YAML**.
2. Open [`crm-agent.yaml`](crm-agent.yaml) (in this folder) and paste the full content.
3. Click **Apply**.

**Key instruction sections:**

```
Primary workflow:
  1. Call getCrmVarianceContext(dept_id, period, account_id?)
  2. Return context_summary verbatim — this is the root cause narrative
  3. List slipped deals: name, value, slip_reason, rescheduled_close
  4. Report pipeline coverage_ratio — flag ⚠️ if < 1.0

Constraint:
  Never fabricate deal names, amounts, or reasons.
  Only use data returned directly from the API.
```

---

### Step A3 — Add CRM Tools

1. **Tools** tab → **Add tools** → **From integration** → `saleslens-crm`.
2. Enable:

```
✅ getCrmVarianceContext       ← primary — always call this first
✅ getCrmDeals                 ← supporting — use for drill-down
✅ getCrmPipelineSummary       ← supporting — use for coverage ratio
```

3. Click **Save**.

> **Do not add ERP tools to this agent.**

---

### Step A4 — Test the CRM Agent

In the agent **Preview** panel, send:

```
Get CRM variance context for DEPT-NA-SALES in January 2024.
```

**Expected tool call:**
```
→ getCrmVarianceContext   dept_id=DEPT-NA-SALES, period=2024-01
```

**Expected response:**
```
🤝 CRM Context — DEPT-NA-SALES | 2024-01

context_summary: "2 deal(s) totalling $200K slipped from 2024-01: Acme Corp
($120K — customer procurement delayed); TechStart ($80K — budget freeze).
Rescheduled: Acme Corp → 2024-02-28, TechStart → 2024-02-15."

Slipped deals:
  • Acme Corp — $120,000 — customer procurement delayed — rescheduled 2024-02-28
  • TechStart Inc — $80,000 — budget freeze — rescheduled 2024-02-15

Pipeline coverage: 1.7x ($850,000 open pipeline)
```

**Try a second test — EMEA favorable variance:**

```
Get CRM context for DEPT-EMEA-SALES, period 2024-01.
```

Expected: an early close (GlobalTech deal) — favorable context.

---

## Part B — ERP Context Agent

### Step B1 — Create the Agent

**Option A — Orchestrate UI:**

| Field | Value |
|-------|-------|
| **Name** | `ERP Context Agent` |
| **Description** | Queries the SalesLens ERP API for unbudgeted purchase orders and headcount events. Returns root cause narratives for OpEx and COGS variances. Does not query Planning Analytics or CRM. |
| **Model** | `ibm/granite-3-3-8b-instruct` (or tenant default) |

**Option B — ADK:**

```bash
orchestrate agents import \
  --file ./erp-agent.yaml
```

---

### Step B2 — Import ERP Agent Instructions

1. **Instructions** tab → **Import from YAML**.
2. Open [`erp-agent.yaml`](erp-agent.yaml) (in this folder) and paste.
3. Click **Apply**.

**Key instruction sections:**

```
Primary workflow:
  1. Call getErpCostContext(dept_id, period, account_id?)
  2. Return context_summary verbatim — this is the root cause narrative
  3. List unbudgeted POs: vendor, category, amount, reason
  4. List headcount events: role, event_type, monthly_cost
  5. Report total_unplanned_cost

Constraint:
  Never fabricate vendor names, PO amounts, or headcount roles.
  Only use data returned directly from the API.
```

---

### Step B3 — Add ERP Tools

1. **Tools** tab → **Add tools** → **From integration** → `saleslens-erp`.
2. Enable:

```
✅ getErpCostContext            ← primary — always call this first
✅ getErpPurchaseOrders         ← supporting — use for PO drill-down
✅ getErpHeadcountEvents        ← supporting — use for HC drill-down
```

3. Click **Save**.

> **Do not add CRM tools to this agent.**

---

### Step B4 — Test the ERP Agent

In the agent **Preview** panel, send:

```
Get ERP cost context for DEPT-NA-SALES in January 2024.
```

**Expected tool call:**
```
→ getErpCostContext   dept_id=DEPT-NA-SALES, period=2024-01
```

**Expected response:**
```
🏭 ERP Context — DEPT-NA-SALES | 2024-01

context_summary: "1 unbudgeted purchase order(s) totalling $18K:
TechWorld Events LLC — Events & Conferences (PO-2024-0142): Reactive
participation in TechWorld Summit. 1 unbudgeted headcount event(s)
adding $8K/month: Enterprise Account Executive (new_hire): Hire approved
via headcount exception."

Unbudgeted POs:
  • TechWorld Events LLC — Events & Conferences — $18,000
    Reason: Reactive participation in TechWorld Summit

Headcount events:
  • Enterprise Account Executive — new_hire — $8,500/month

Total unplanned cost: $26,000
```

**Try a second test — Prod Eng GPU spend:**

```
Get ERP cost context for DEPT-PROD-ENG in March 2025.
```

Expected: NVIDIA GPU purchase order + ML contractor headcount event.

---

## ✅ Checkpoint

Before moving to Lab 2.5, confirm:

- [ ] `CRM Context Agent` shows **Active** in Orchestrate — 3 CRM tools attached
- [ ] `ERP Context Agent` shows **Active** in Orchestrate — 3 ERP tools attached
- [ ] CRM test: `getCrmVarianceContext` returns `context_summary` with 2 slipped deals
- [ ] ERP test: `getErpCostContext` returns `context_summary` with PO + headcount event
- [ ] Neither agent has tools from the other system

---

## Variance Scenarios You Can Test

| Period | Dept | Account | Expected CRM/ERP response |
|--------|------|---------|--------------------------|
| 2024-01 | DEPT-NA-SALES | REV-001 | CRM: 2 slipped deals ($200K) |
| 2024-01 | DEPT-EMEA-SALES | REV-001 | CRM: 1 early close (GlobalTech) |
| 2024-01 | DEPT-NA-SALES | OPEX-001 | ERP: TechWorld PO + new hire |
| 2024-01 | DEPT-PROF-SVC | COGS-001 | ERP: CloudSkills contractor premium |
| 2024-03 | DEPT-APAC-SALES | REV-001 | CRM: Sino-Digital regulatory delay |
| 2025-03 | DEPT-PROD-ENG | OPEX-002 | ERP: NVIDIA GPU + ML contractor |

---

## Troubleshooting

**getCrmVarianceContext returns empty `slipped_deals`**  
→ Check dept_id spelling exactly: `DEPT-NA-SALES` (all caps, hyphens).  
→ Check period format: `2024-01` not `January 2024`.  
→ Verify the API key credential in the `saleslens-crm` integration.

**getErpCostContext returns 404**  
→ Check the SalesLens app is running: `curl <BASE_URL>/health`  
→ Valid dept IDs for ERP include all 12 departments (not just Sales regions).

**Agent calls the wrong tool first**  
→ Review the instructions — the agent should call `getCrmVarianceContext` / `getErpCostContext` first, not the filter endpoints.  
→ Add to the top of the instructions: `Always start with the primary endpoint (getCrmVarianceContext / getErpCostContext) before calling filter endpoints.`

---

## Next

→ **[Lab 2.5 — Create the Orchestrator Agent](../lab-02-5-orchestrator/README.md)**
