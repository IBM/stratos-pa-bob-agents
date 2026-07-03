# Lab 2 — FP&A Variance Autopilot

**Duration:** 60 minutes
**Tools:** watsonx Orchestrate + IBM Planning Analytics + IBM Bob
**Prerequisite:** [Lab 0](../lab-00-setup/README.md) ✅ and [Lab 1](../lab-01-bob-planning-analytics-mcp/README.md) ✅ completed

---

## Overview

Your FP&A team currently spends **3–4 days each month** manually investigating budget variances across dozens of cost centres. They cross-reference Planning Analytics data, CRM pipeline reports, and ERP metrics — and by the time root causes are identified, the window for corrective action has often closed.

**In this lab, you will build and run an AI agent** — the **FP&A Variance Autopilot** — that:

1. **Detects** material budget variances (>$100K or >20%) the moment actuals land in Planning Analytics
2. **Investigates** root causes by querying CRM and ERP systems for business context
3. **Generates** a clear, plain-language explanation for each variance
4. **Writes back** the explanation to Planning Analytics as a cell annotation
5. **Routes alerts** to the right stakeholders based on severity

Time to complete the same workflow: **under 5 minutes**.

---

## What You Will Do

| Exercise | Task | Time |
|----------|------|------|
| [Exercise 1](#exercise-1--explore-the-fpa-dataset-in-planning-analytics) | Explore the FPA dataset in Planning Analytics | 10 min |
| [Exercise 2](#exercise-2--detect-material-variances-with-bob) | Detect material variances using Bob | 10 min |
| [Exercise 3](#exercise-3--build-the-fpa-variance-autopilot-agent) | Build the FP&A Variance Autopilot in Orchestrate | 15 min |
| [Exercise 4](#exercise-4--run-the-end-to-end-autopilot-flow) | Run the end-to-end autopilot flow | 15 min |
| [Exercise 5](#exercise-5--review-results-and-write-back) | Review results and PA write-back | 10 min |

---

## The Dataset

The FP&A dataset in this lab is located in `lab-02-fpa-variance-autopilot/assets/`. It models a software company's financial performance across multiple departments and geographies.

### Dimensions

| File | Dimension | Description |
|------|-----------|-------------|
| `dim_account.csv` | Account | Revenue, COGS, OPEX accounts with GL codes |
| `dim_department.csv` | Department | Sales regions, Engineering, Services, G&A |
| `dim_scenario.csv` | Scenario | Budget, Actual, Forecast, Prior Year |
| `dim_time.csv` | Time | Monthly periods Jan 2023 – Jun 2026 |
| `dim_version.csv` | Version | V1 (Actuals), V2 (Budget), V4 (Forecast) |

### Fact Data Highlights

The `fact_financial_data.csv` contains real-world-style variance scenarios including:

| Period | Department | Account | Variance | Story |
|--------|-----------|---------|---------|-------|
| Jan 2024 | NA Sales | Enterprise Software Revenue | -$175K (-35%) | 2 deals slipped to February |
| Jan 2024 | EMEA Sales | Enterprise Software Revenue | +$40K (+10.5%) | Unexpected enterprise deal closed early |
| Jan 2024 | NA Sales | Sales & Marketing OpEx | +$25K (+20.8%) | Unplanned trade show + new headcount |
| Jan 2024 | Professional Services | COGS | +$7K (+9.3%) | Contractor cost premium |
| Mar 2024 | APAC Sales | Enterprise Software Revenue | -$85K (-30.4%) | Regulatory approval delay in China |
| May 2024 | EMEA Sales | Enterprise Software Revenue | -$35K (-8.3%) | UK market uncertainty |
| Mar 2025 | Product Engineering | R&D OpEx | +$45K (+8.7%) | AI/ML platform acceleration |

---

## Exercise 1 — Explore the FPA Dataset in Planning Analytics

**Goal:** Familiarise yourself with the FP&A cube structure before running the autopilot.

> **Note:** If you completed Exercise 5 in Lab 1, the `FPA_Variance` cube is already loaded. If not, ask your facilitator — the cube may be pre-loaded on the TechZone server.

### Step 1.1 — Confirm Cube Exists

In Bob (Planning Analytics mode), send:

```
List available cubes on the DemoGuide server and show me the structure
of the FPA_Variance cube including its dimensions
```

**Expected output:** The `FPA_Variance` cube with dimensions: Account, Department, Scenario, Time, Version.

---

### Step 1.2 — View the January 2024 Data

```
Show me January 2024 actual vs budget revenue for all departments in the FPA_Variance cube
```

Review the results. You should see the NA Sales under-performance and EMEA Sales over-performance reflected in the data.

---

### Step 1.3 — Get a Full Q1 2024 Picture

```
Show me Q1 2024 revenue variance across all departments — Budget vs Actual.
Flag any variance greater than $50,000 or 10%.
```

Make a note of the material variances you see. These are the variances the autopilot will be investigating in Exercises 3 and 4.

---

## Exercise 2 — Detect Material Variances with Bob

**Goal:** Use Bob directly to run the variance detection logic that the autopilot will automate.

### Step 2.1 — Run the Variance Detection Prompt

```
Analyse the FPA_Variance cube for January 2024.
Identify all material variances — defined as greater than $100,000 or greater than 20%
in absolute terms across all accounts and departments.
Present findings as a prioritised list with: account, department, budget, actual,
variance amount, variance %, and severity (High/Medium/Low).
```

Bob returns a structured list. The January 2024 data should surface:

- 🔴 **High:** NA Sales Enterprise Software Revenue — -$175K (-35%)
- 🟡 **Medium:** NA Sales Sales & Marketing OpEx — +$25K (+20.8%)

---

### Step 2.2 — Investigate One Variance

Pick the largest variance (NA Sales Revenue) and ask:

```
For the NA Sales Enterprise Software Revenue variance of -$175K in January 2024,
what explanation is recorded in the data? What would you recommend investigating
in a CRM or ERP system to understand the root cause?
```

**Expected output:** Bob reads the `variance_explanation` field from the fact data and supplements it with investigation recommendations:
> *"Enterprise Software missed budget by $175K (-35%) in Jan 2024. Root cause recorded: 2 deals totaling $200K slipped to February due to customer procurement delays and budget freeze. Recommended: Verify in CRM whether Acme Corp ($120K) and TechStart ($80K) are rescheduled for February close."*

---

### Step 2.3 — Generate an AI Explanation

```
Generate a concise, CFO-ready explanation for the January 2024 NA Sales
revenue variance that could be used as a Planning Analytics cell annotation.
Keep it under 3 sentences.
```

**Example output Bob generates:**
> *"Enterprise Software Revenue missed January budget by $175K (35%) due to two significant deal slippages — Acme Corp ($120K) delayed by procurement process and TechStart ($80K) impacted by customer budget freeze. Both opportunities remain in pipeline with high close probability and are expected to convert in February. No forecast adjustment required; this is a timing-related variance."*

This is exactly the kind of explanation the autopilot will generate automatically.

---

## Exercise 3 — Build the FP&A Variance Autopilot Agent

**Goal:** Configure the FP&A Variance Autopilot in **watsonx Orchestrate** using the pre-built agent YAML definition.

### Step 3.1 — Open watsonx Orchestrate

1. Navigate to your watsonx Orchestrate tenant in the browser.
2. In the left navigation, select **Agents**.
3. Click **Create agent** (or **Import agent** if that option is available in your tenant).

---

### Step 3.2 — Import the Agent YAML

The agent definition is provided in `assets/fpa-variance-agent.yaml`. This file defines:

- **Agent name and description** — FP&A Variance Autopilot
- **Instructions** — the agent's persona, reasoning steps, and response format
- **Tools** — the Planning Analytics MCP tools the agent is authorised to use
- **Output format** — structured variance report with confidence score

**Import steps:**

1. Click **Import from YAML** in Orchestrate (or copy the YAML content into the agent editor).
2. Open `lab-02-fpa-variance-autopilot/assets/fpa-variance-agent.yaml` from this repository.
3. Paste the full YAML content.
4. Click **Save** or **Create**.

> **Note:** If your Orchestrate tenant does not support YAML import, your facilitator will guide you through creating the agent manually using the form-based editor. The key fields are documented in [Appendix A](#appendix-a--agent-configuration-reference).

---

### Step 3.3 — Connect the Planning Analytics MCP Tools

1. In the agent's **Tools** section, add the Planning Analytics MCP connection.
2. Enter the MCP server URL: `http://<TECHZONE_HOST>:<PORT>/api/<YOUR_TENANT_ID>/v0/agentic-ai/cube/mcp`
3. Add the Authorization header using your Base64 credentials.
4. Enable the following tools:
   - `get_available_tm1_servers`
   - `list_cubes_with_ai_analysis_metadata`
   - `get_cube_dimensions`
   - `get_cube_sample_members`
   - `get_data_from_data_explorer`
   - `execute_mdx_and_get_view`
   - `perform_outlier_detection`
   - `get_outlier_summary`

5. Click **Save**.

---

### Step 3.4 — Review the Agent Instructions

Before running the agent, review the core instructions in the YAML. Key sections:

**Variance Detection Logic:**
```
Material variance thresholds:
  - Revenue: > $100,000 or > 20% (unfavourable = actual < budget)
  - OpEx: > $50,000 or > 15% (unfavourable = actual > budget)

Severity classification:
  - HIGH: > 25% or > $150,000
  - MEDIUM: 15–25% or $75,000–$150,000
  - LOW: 10–15% or $25,000–$75,000
```

**Root Cause Investigation Steps:**
```
1. Query Planning Analytics for variance data
2. Check variance_explanation field in cube data
3. Cross-reference with CRM for deal slippage context
4. Cross-reference with ERP for operational cost context
5. Generate plain-language explanation
6. Assign confidence score (0.0 – 1.0)
```

---

## Exercise 4 — Run the End-to-End Autopilot Flow

**Goal:** Trigger the FP&A Variance Autopilot and observe the complete automated analysis.

### Step 4.1 — Trigger the Autopilot

In the Orchestrate agent chat, send the following prompt:

```
Run the FP&A variance analysis for January 2024 on the FPA_Variance cube
on the DemoGuide server. Identify all material variances, investigate root
causes, and generate a full variance report with explanations.
```

**Watch the agent work:** In the Orchestrate interface you can observe the tool call sequence:
1. `get_available_tm1_servers` — identifies the server
2. `list_cubes_with_ai_analysis_metadata` — checks pre-analysis status
3. `get_cube_dimensions` — maps the cube structure
4. `get_data_from_data_explorer` or `execute_mdx_and_get_view` — retrieves variance data
5. Analysis and explanation generation
6. Output formatting

---

### Step 4.2 — Review the Output

The autopilot should produce a structured report similar to:

```
📊 FP&A Variance Analysis — January 2024

Server: DemoGuide | Cube: FPA_Variance | Period: 2024-01
Analysis completed in: 4.2 seconds

MATERIAL VARIANCES DETECTED: 2

─────────────────────────────────────────────────────────────
🔴 HIGH SEVERITY — NA Sales | Enterprise Software Revenue
─────────────────────────────────────────────────────────────
  Budget:    $500,000
  Actual:    $325,000
  Variance:  -$175,000 (-35.0%)

  Root Cause:
  Two enterprise deals totaling $200K slipped from January to
  February. Acme Corp ($120K) delayed by procurement process;
  TechStart ($80K) impacted by customer budget freeze. Both
  remain in pipeline with high close probability.

  Classification: Timing-related slippage — no structural issue
  CRM Action Required: Confirm February close dates
  Forecast Adjustment: None recommended

─────────────────────────────────────────────────────────────
🟡 MEDIUM SEVERITY — NA Sales | Sales & Marketing OpEx
─────────────────────────────────────────────────────────────
  Budget:    $120,000
  Actual:    $145,000
  Variance:  +$25,000 (+20.8%)

  Root Cause:
  Unplanned trade show participation ($18K) and additional
  headcount hired in December carrying into January. Trade
  show was reactive to competitive activity.

  Classification: Controllable overspend — review required
  Action Required: Assess trade show ROI; validate HC plan
  Forecast Adjustment: Consider +$15K Q1 OpEx adjustment

─────────────────────────────────────────────────────────────

POSITIVE VARIANCE NOTED (No Action Required):
✅ EMEA Sales — Enterprise Software Revenue: +$40K (+10.5%)
   Early close of GlobalTech deal — pipeline execution.

─────────────────────────────────────────────────────────────
SUMMARY
  Total Revenue Variance:   -$135,000 (-8.8% vs budget)
  Total OpEx Variance:      +$25,000  (+7.5% vs budget)
  Material Variances:       2 (1 High, 1 Medium)
  Variances with Explanation: 100%

RECOMMENDED ACTIONS:
  1. [HIGH] Confirm February close for Acme Corp + TechStart
  2. [MEDIUM] Review NA Sales OpEx run-rate vs budget
  3. [LOW] Document EMEA early close in pipeline report

Confidence: 0.91 | Alerts: VP Sales (email), FP&A Mgr (dashboard)
```

---

### Step 4.3 — Run for a Different Period

Try the autopilot on another period from the dataset:

```
Run the variance analysis for March 2024 on the FPA_Variance cube.
Focus on any APAC Sales variances and provide root cause analysis.
```

The March 2024 data shows a -$85K APAC variance due to a regulatory approval delay in China. The agent should surface and explain this.

---

## Exercise 5 — Review Results and Write-Back

**Goal:** Understand how the autopilot outputs feed back into Planning Analytics and how stakeholder alerts are structured.

### Step 5.1 — Simulate a PA Write-Back

In the Orchestrate agent, ask:

```
Take the variance explanation generated for NA Sales Enterprise Software Revenue
in January 2024 and format it as a Planning Analytics cell annotation.
What TurboIntegrator process would be needed to write this back to the cube?
```

The agent will provide:
1. The formatted annotation string (under 500 characters)
2. A TurboIntegrator code snippet using `CellPutS` that writes the explanation to the appropriate cell intersection

> **Production note:** In a live implementation, the agent would call the TurboIntegrator MCP tools (`create_tm1_process`, `update_tm1_process`, `execute_tm1_processes_asynchronously`) to write the annotation directly — no manual step required.

---

### Step 5.2 — Review the Alert Routing Logic

Ask:

```
Based on the January 2024 variance report, which stakeholders should receive
alerts and what information should each alert contain?
Show me the alert content for each stakeholder type.
```

**Expected output:**

| Stakeholder | Channel | Content |
|-------------|---------|---------|
| Regional VP Sales | Email — High Priority | Full variance summary, deal names, CRM action required |
| FP&A Manager | Dashboard update | Variance table, severity flags, recommended forecast adjustment |
| CFO | Weekly digest | Net variance summary only, severity count |
| Sales Team | Slack / Teams | Pipeline context for slipped deals |

---

### Step 5.3 — Discuss: Adapting the Alert Rules

Consider how the alert routing logic would need to change for your organisation:

- What variance thresholds are meaningful for your business?
- Which stakeholders need real-time vs daily vs weekly alerts?
- What external systems (CRM, ERP, HR) hold the root cause context?
- What format does your CFO prefer for variance commentary?

These are the adaptation questions you will work through in **Lab 3**.

---

## Architecture: How the Autopilot Works

```
                    ┌─────────────────────────────────┐
                    │      watsonx Orchestrate          │
                    │   FP&A Variance Autopilot Agent   │
                    └──────────┬──────────┬────────────┘
                               │          │
               ┌───────────────▼──┐    ┌──▼────────────────┐
               │  Planning         │    │  External Systems  │
               │  Analytics MCP    │    │  (CRM / ERP)       │
               │                   │    │                    │
               │  • FPA_Variance   │    │  • Deal pipeline   │
               │    cube query     │    │  • Cost data       │
               │  • Variance data  │    │  • Operational     │
               │  • PA write-back  │    │    context         │
               └──────────┬────────┘    └──────────┬─────────┘
                          │                        │
                    ┌─────▼────────────────────────▼─────┐
                    │       AI Explanation Engine          │
                    │  • Root cause synthesis              │
                    │  • Confidence scoring                │
                    │  • Narrative generation              │
                    └──────────────────┬─────────────────┘
                                       │
                    ┌──────────────────▼─────────────────┐
                    │         Stakeholder Alerts           │
                    │  Email · Dashboard · Slack · PA Note │
                    └─────────────────────────────────────┘
```

---

## Business Value Summary

| Metric | Manual Process | With Autopilot |
|--------|---------------|----------------|
| Time to investigate variances | 3–4 days | < 5 minutes |
| Coverage (% of variances explained) | ~60% (resource limited) | 100% |
| Stakeholder notification | Day 3–4 of close | Immediate |
| Audit trail in Planning Analytics | Manual, inconsistent | Automatic, timestamped |
| CRM/ERP cross-reference | Manual lookup | Automatic |

---

## Troubleshooting

### Agent returns no variances

Confirm the cube name and period. The cube must be named `FPA_Variance` and contain data for the period you request. Ask Bob: `List all cubes on DemoGuide server` to verify.

### Agent cannot connect to Planning Analytics

Check that the MCP server URL and credentials in the Orchestrate tool configuration match your Lab 0 MCP configuration exactly.

### YAML import fails in Orchestrate

Some Orchestrate tenants require the agent to be created manually. Refer to [Appendix A](#appendix-a--agent-configuration-reference) for the key fields and create the agent using the form editor.

### CRM / ERP systems not available

The lab dataset includes `variance_explanation` fields in `fact_financial_data.csv` that simulate CRM/ERP context. The agent will use these when external systems are not connected. In a production implementation, these would be live API calls.

---

## Appendix A — Agent Configuration Reference

If creating the agent manually in Orchestrate:

| Field | Value |
|-------|-------|
| **Name** | FP&A Variance Autopilot |
| **Description** | Automatically detects material budget variances in Planning Analytics, investigates root causes, generates explanations, and routes stakeholder alerts |
| **Model** | `ibm/granite-3-3-8b-instruct` or your tenant default |
| **Variance threshold — Revenue** | > $100,000 or > 20% |
| **Variance threshold — OpEx** | > $50,000 or > 15% |
| **Severity — HIGH** | > 25% or > $150,000 |
| **Severity — MEDIUM** | 15–25% or $75K–$150K |
| **Severity — LOW** | 10–15% or $25K–$75K |
| **Response format** | Structured report: metadata → material variances → summary → recommended actions → confidence |

---

## Appendix B — Sample MDX for Manual Variance Query

If you need to retrieve variance data directly without the agent:

```mdx
SELECT
  {[Scenario].[Scenario].[BUD], [Scenario].[Scenario].[ACT]} ON COLUMNS,
  {[Department].[Department].MEMBERS} ON ROWS
FROM [FPA_Variance]
WHERE (
  [Account].[Account].[REV-001],
  [Time].[Time].[2024-01],
  [Version].[Version].[V1]
)
```

---

## What's Next

Continue to **Lab 3: Adapt to Your Own Use Case** →

[→ Go to Lab 3](../lab-03-bring-your-own-usecase/README.md)
