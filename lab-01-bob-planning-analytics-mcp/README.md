# Lab 1 — Bob + Planning Analytics via MCP

**Duration:** 45 minutes
**Mode:** 📊 Planning Analytics (Bob custom mode)
**Prerequisite:** [Lab 0 — Environment Setup](../lab-00-setup/README.md) completed ✅

---

## Overview

In this lab you will use **IBM Bob** in Planning Analytics mode to interact with a live TM1 environment through the **Model Context Protocol (MCP)**. You will explore the available data, query cubes using natural language, perform variance and outlier analysis, and build a complete TM1 model from CSV data — all through conversational AI, without writing MDX or TurboIntegrator code manually.

### What You Will Do

| Exercise | Task | Time |
|----------|------|------|
| [Exercise 1](#exercise-1--explore-the-tm1-environment) | Discover servers, cubes, and dimensions | 8 min |
| [Exercise 2](#exercise-2--natural-language-cube-queries) | Query cube data using plain English | 10 min |
| [Exercise 3](#exercise-3--variance-analysis) | Run budget vs actual variance analysis | 10 min |
| [Exercise 4](#exercise-4--outlier-and-impact-analysis) | Detect outliers and key drivers | 10 min |
| [Exercise 5](#exercise-5--build-a-tm1-model-from-csv) | Build a cube and load data via TurboIntegrator | 7 min |

---

## Background

### How Bob Connects to Planning Analytics

Bob uses the **Planning Analytics MCP integration** — two MCP servers that expose over 20 TM1 tools:

- **`ibm-pa-tools-tz-cube`** — cube discovery, data queries, MDX execution, analysis
- **`ibm-pa-tools-tz-server`** — TurboIntegrator process management

When you ask Bob a question in Planning Analytics mode, Bob orchestrates the right sequence of MCP tool calls, handles errors automatically, and presents the results in a business-friendly format.

### Key Decision: Pre-Analyzed vs MDX

Bob uses an adaptive query strategy:

```
Is the cube pre-analyzed?
  ├── YES → get_data_from_data_explorer  (natural language query)
  └── NO  → execute_mdx_and_get_view     (MDX query, any cube)
```

You will encounter both paths in this lab.

---

## Exercise 1 — Explore the TM1 Environment

**Goal:** Understand what data is available on the TM1 server before querying it.

### Step 1.1 — List Available Servers

In the Bob chat panel, send:

```
List all available TM1 servers
```

Bob will call `get_available_tm1_servers` and return the server name(s) for your TechZone environment. **Note the server name** — you will reference it throughout this lab.

**Expected output:**
```
Available TM1 Servers:
- DemoGuide  (or the TechZone server name provided by your facilitator)
```

---

### Step 1.2 — Browse Available Cubes

```
Show me all cubes available on the server, including which ones are pre-analyzed
```

Bob calls `list_cubes_with_ai_analysis_metadata` and returns a table of cubes with their pre-analysis status. Cubes marked `is_analyzed: true` support natural language queries.

> **What to observe:** Note which cubes are pre-analyzed — these will be used in Exercise 2. Cubes that are not pre-analyzed will be queried using MDX in Exercise 3.

---

### Step 1.3 — Explore a Cube's Structure

Pick one of the pre-analyzed cubes from Step 1.2 and ask:

```
Show me the dimensions and sample members for the [cube name] cube
```

Bob calls `get_cube_dimensions` and `get_cube_sample_members` to return the dimension structure and a sample of available members (time periods, versions, accounts, etc.).

**Discussion Point:** How does the dimension structure map to the financial concepts you work with — periods, scenarios, cost centres?

---

## Exercise 2 — Natural Language Cube Queries

**Goal:** Query TM1 cube data using plain English — no MDX required.

> **Prerequisite:** Use a pre-analyzed cube identified in Exercise 1. If no pre-analyzed cubes are available, skip to Exercise 3.

### Step 2.1 — Basic Query

```
Show me revenue data for Q1 by department
```

Bob selects the appropriate cube, maps your business terms to TM1 dimension members, executes the query, and returns a formatted table with an explanation of what was selected.

**What to observe:**
- Bob's `explanation` field — how did it interpret your query?
- The filter context — which time period, version, and organisation was applied?
- Whether the cube used `get_data_from_data_explorer` (natural language) or `execute_mdx_and_get_view` (MDX)

---

### Step 2.2 — Budget vs Actual Comparison

```
Show me budget vs actual revenue for January 2024, broken down by department
```

**Expected output:** A table with `Budget`, `Actual`, and optionally `Variance` columns, organised by department.

---

### Step 2.3 — Drill Down

Based on the results from Step 2.2, follow up with:

```
Which departments had the largest revenue gap between budget and actual?
```

Bob interprets the context from the previous query and narrows the analysis.

---

## Exercise 3 — Variance Analysis

**Goal:** Perform a structured budget vs actual variance analysis including material variance identification.

### Step 3.1 — Run a Full Variance Analysis

```
Perform a full variance analysis on revenue for January 2024 across all departments.
Identify all variances greater than $100,000 or greater than 20%, and explain what you find.
```

Bob will:
1. Discover the correct cube and dimensions
2. Query both Budget and Actual versions
3. Calculate variance amounts and percentages
4. Flag material variances (>$100K or >20%)
5. Generate business insights

**Expected output format:**
```
📊 January 2024 Revenue Variance Analysis

Server: DemoGuide | Cube: FPA_Financial | Period: 2024-01

| Department        | Budget    | Actual    | Variance ($) | Variance (%) |
|-------------------|-----------|-----------|--------------|--------------|
| NA Sales          | $500,000  | $325,000  | -$175,000    | -35.0% ⚠️  |
| EMEA Sales        | $380,000  | $420,000  | +$40,000     | +10.5% ✅  |
| APAC Sales        | $280,000  | $275,000  | -$5,000      | -1.8%       |
...

Key Findings:
- NA Sales missed budget by $175K (-35%) — largest material variance
- EMEA Sales exceeded budget by $40K — positive outlier
...
```

---

### Step 3.2 — Save a View

```
Save this variance view as "Jan2024_Revenue_Variance" for future reference
```

Bob calls `save_mdx_view` to persist the query state. Saved views can be retrieved by any team member.

---

### Step 3.3 — Period-over-Period Comparison

```
Compare January 2024 actual revenue to January 2023 actual revenue by department.
Show year-over-year growth rates.
```

---

## Exercise 4 — Outlier and Impact Analysis

**Goal:** Use Bob's advanced analytics capabilities to detect anomalies and identify the key drivers behind variance.

> These exercises use `perform_outlier_detection` and `perform_impact_analysis` — advanced MCP tools that require a query `state` from a previous data retrieval step. Bob handles this automatically.

### Step 4.1 — Outlier Detection

```
Using the January 2024 revenue data, detect any statistical outliers across departments.
Explain what you find in business terms.
```

Bob runs multiple outlier detection algorithms and returns:
- Detected anomalies with their statistical significance
- Business context for each outlier
- Recommended investigation actions

**What to observe:** Note that Bob identifies both over-budget and under-budget outliers. An unexpectedly positive result is also flagged.

---

### Step 4.2 — Key Driver Analysis

```
What are the key drivers of the revenue variance in January 2024?
Which factors have the highest impact on the total variance?
```

Bob calls `perform_impact_analysis` and `get_impact_analysis_summary` to identify which departments, products, or accounts are driving the most significant movement.

---

### Step 4.3 — Generate a Report

```
Generate a PDF analysis report for the January 2024 revenue data
```

Bob calls `generate_exploration_analysis_report` and returns a base64-encoded PDF with charts, summary statistics, and AI-generated insights — ready for executive presentation.

---

## Exercise 5 — Build a TM1 Model from CSV

**Goal:** Experience Bob's full TM1 development capability — creating dimensions, a cube, and loading data — all through natural language, with no manual TurboIntegrator coding.

### Background: The Dataset

The workshop repository includes a set of CSV files for an **FP&A Variance Analysis** model under `lab-02-fpa-variance-autopilot/assets/`. For this exercise, you will instruct Bob to build a TM1 cube from these files.

The dataset contains:
- `dim_account.csv` — Account dimension (Revenue, COGS, OPEX categories)
- `dim_department.csv` — Department dimension (Sales regions, Engineering, Services)
- `dim_scenario.csv` — Scenario dimension (Budget, Actual, Forecast, Prior Year)
- `dim_time.csv` — Time dimension (Monthly periods 2023–2026)
- `dim_version.csv` — Version dimension
- `fact_financial_data.csv` — Financial fact data with Budget and Actual amounts

---

### Step 5.1 — Ask Bob to Build the Model

Open a file browser to the `lab-02-fpa-variance-autopilot/assets/` folder so the CSV files are visible in your workspace. Then send Bob:

```
I have CSV files in the lab-02-fpa-variance-autopilot/assets/ folder for an FP&A model.
Read the dimension files (dim_account.csv, dim_department.csv, dim_scenario.csv,
dim_time.csv, dim_version.csv) and the fact file (fact_financial_data.csv).

Create a complete TM1 model on the DemoGuide server:
- Create all required dimensions with their elements and attributes
- Create a cube called FPA_Variance with those dimensions
- Write a TurboIntegrator process to load the fact data
- Execute the process and confirm the data loaded correctly
```

**What Bob does:**
1. Reads the CSV files from your workspace
2. Designs the dimension structures based on the data
3. Writes TurboIntegrator (TI) code for the prolog (dimension/cube creation) and epilog (data loading)
4. Calls `create_tm1_process` → `update_tm1_process` → `execute_tm1_processes_asynchronously`
5. Monitors with `get_tm1_server_process_status`
6. Verifies data with `execute_mdx_and_get_view`

> **Time note:** The TI process creation and execution typically takes 2–4 minutes. Bob will show progress updates.

---

### Step 5.2 — Verify the Data Loaded

Once Bob confirms the process succeeded, validate the data yourself:

```
Show me a sample of data from the FPA_Variance cube —
NA Sales actual revenue for Q1 2024 across all accounts
```

**Expected result:** You should see the actual revenue figures from `fact_financial_data.csv` appearing correctly in the cube.

---

### Step 5.3 — Explore Your New Cube

```
List the dimensions on my FPA_Variance cube and show sample members from each
```

---

## Key Takeaways from Lab 1

| Capability | What You Experienced |
|-----------|---------------------|
| **Natural language queries** | Queried TM1 cubes without MDX knowledge |
| **Adaptive tool selection** | Bob chose `data_explorer` vs `execute_mdx` based on cube status |
| **Variance analysis** | Structured Budget vs Actual comparison with material variance flagging |
| **Outlier detection** | Statistical anomaly detection with business explanation |
| **TM1 model development** | Full cube creation from CSV via TurboIntegrator — driven by Bob |
| **Zero manual TI coding** | Bob handled all syntax, execution, monitoring, and error recovery |

---

## MCP Tools Reference

| Tool | Purpose | Used In |
|------|---------|---------|
| `get_available_tm1_servers` | List available TM1 servers | Exercise 1 |
| `list_cubes_with_ai_analysis_metadata` | Find cubes with pre-analysis status | Exercise 1 |
| `get_cube_dimensions` | Get dimensions for a cube | Exercise 1 |
| `get_cube_sample_members` | See available members per dimension | Exercise 1 |
| `get_data_from_data_explorer` | Natural language query (pre-analyzed cubes) | Exercise 2 |
| `execute_mdx_and_get_view` | MDX query execution (any cube) | Exercise 3 |
| `save_mdx_view` | Persist a view for reuse | Exercise 3 |
| `perform_outlier_detection` | Statistical anomaly detection | Exercise 4 |
| `get_outlier_summary` | AI explanation of outliers | Exercise 4 |
| `perform_impact_analysis` | Key driver identification | Exercise 4 |
| `get_impact_analysis_summary` | AI explanation of key drivers | Exercise 4 |
| `generate_exploration_analysis_report` | PDF report generation | Exercise 4 |
| `create_tm1_process` | Create a TurboIntegrator process | Exercise 5 |
| `update_tm1_process` | Write TI code to a process | Exercise 5 |
| `execute_tm1_processes_asynchronously` | Execute a TI process | Exercise 5 |
| `get_tm1_server_process_status` | Monitor process execution | Exercise 5 |
| `create_tm1_cube` | Create a cube programmatically | Exercise 5 |

---

## Troubleshooting

### "Cube not pre-analyzed" error

This is expected for cubes without AI metadata. Bob will automatically switch to `execute_mdx_and_get_view`. You do not need to take any action — Bob handles this transparently.

### "Member not found" in MDX query

Bob will call `lookup_potential_members` to search for the correct member name. If the correct name is ambiguous, Bob will present options and ask you to confirm.

### TurboIntegrator process fails in Exercise 5

1. Ask Bob: `Show me the error logs for the last TI process`
2. Bob calls `get_tm1_server_process_execution_error_logs` and explains the cause
3. Bob will suggest a corrected version of the process automatically

---

## What's Next

Continue to **Lab 2: FP&A Variance Autopilot** →

[→ Go to Lab 2](../lab-02-fpa-variance-autopilot/README.md)
