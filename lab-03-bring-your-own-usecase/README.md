# Lab 3 — Adapt to Your Own Use Case

**Duration:** 30 minutes
**Format:** Open exploration with facilitator support
**Prerequisite:** [Lab 2](../lab-02-fpa-variance-autopilot/README.md) ✅ completed

---

## Overview

You have now experienced the **FP&A Variance Autopilot** end-to-end. In this session, you will take what you have learned and start shaping it toward a Planning Analytics or FP&A scenario from your own organisation.

This is not a structured exercise — it is guided exploration time. Use Bob, the Planning Analytics mode, and the autopilot pattern as your starting point. A facilitator will circulate to help you.

---

## How to Use This Session

Work through the three stages below. You do not need to complete all three in 30 minutes — depth is more valuable than speed. Pick the scenario that is most relevant to your real work and go as far as you can.

---

## Stage 1 — Define Your Scenario (5 minutes)

Pick a Planning Analytics use case from your own organisation. Use the questions below to frame it clearly before you start prompting Bob.

### Framing Questions

**1. What is the planning object?**
> What is the data you are working with? Examples:
> - Revenue by product line, region, and month
> - Headcount and compensation by department
> - Capital expenditure by project and cost centre
> - Manufacturing costs by plant and product

**2. What is the variance story?**
> What kind of comparison matters most? Examples:
> - Budget vs Actual (end-of-month close)
> - Forecast vs Actual (mid-month flash)
> - Year-over-Year performance
> - Plan vs Latest Estimate (rolling forecast)

**3. What external context would explain the variance?**
> Where does the root cause usually live? Examples:
> - CRM: deal slippage, pipeline changes, customer churn
> - ERP: purchase order delays, cost overruns, headcount changes
> - HRIS: open positions, attrition, contractor spend
> - Operations: production downtime, yield rates, supplier issues

**4. Who needs to know?**
> Stakeholders and their preferred channels:
> - CFO / Finance leadership → board pack narrative
> - Regional VP → email with deal-level detail
> - FP&A team → dashboard with drill-through
> - Department heads → Slack alert with budget status

**5. What does "material" mean in your context?**
> Define your variance thresholds:
> - Revenue: > $X or > Y%?
> - Expenses: > $X or > Y%?
> - Headcount: > N heads or > Y% of plan?

Write your answers down. You will use them to prompt Bob in Stage 2.

---

## Stage 2 — Explore with Bob (15 minutes)

With your scenario framed, use Bob in Planning Analytics mode to explore what is possible. The prompts below are starting points — adapt them to your scenario.

---

### Option A — Explore an Existing Cube

If you have access to a real or demo Planning Analytics environment with data relevant to your scenario:

```
I want to analyse [your planning object] in Planning Analytics.
Help me discover the right cube, understand its dimensions, and
run a [Budget vs Actual / Forecast vs Actual / YoY] variance
analysis for [your time period] focused on [your scope].
Flag any variances greater than [your threshold].
```

Follow Bob's response and drill down into the areas that matter most.

---

### Option B — Design the Data Model

If you are starting from scratch or want to think through the TM1 model for your use case:

```
I want to build a TM1 model for [your planning object].
My key dimensions are [list them].
My key measures are [list them].
My comparison versions are [Budget, Actual, Forecast, etc.].

Help me design the cube structure, suggest a dimension hierarchy
for [your most complex dimension], and show me what the fact data
would look like in a sample CSV format.
```

---

### Option C — Adapt the Variance Autopilot

Take the FP&A Variance Autopilot from Lab 2 and start adapting its instructions for your scenario:

```
I want to adapt the FP&A Variance Autopilot from Lab 2 for my
own use case. My scenario is:

- Planning object: [describe it]
- Variance comparison: [Budget vs Actual / Forecast vs Actual / etc.]
- Material threshold: [your thresholds]
- Root cause systems: [CRM / ERP / HRIS / Operations]
- Key stakeholders: [list them with channels]

What changes would I need to make to the agent instructions
in fpa-variance-agent.yaml to support this scenario?
Show me a draft of the updated agent instructions.
```

---

### Option D — Generate Sample Data

If you want to test a concept but don't have real data:

```
Generate a sample CSV dataset for [your planning object] that
I could use to build a TM1 proof of concept. Include:
- [dimension 1] with realistic members
- [dimension 2] with realistic members
- [time dimension] covering [your range]
- Budget and Actual fact data with some material variances baked in
- Variance explanations that reflect real root causes from [your industry]

Format it as separate dimension CSV files and a fact CSV file.
```

---

## Stage 3 — Identify Your Next Steps (10 minutes)

Capture the outputs from Stage 2 and define what a logical next step would look like for your organisation.

### Output Template

Use Bob to generate a short summary:

```
Based on our exploration in this session, summarise:

1. The Planning Analytics use case I was exploring
2. The key TM1 model components needed
3. What the variance autopilot would look like for this scenario
4. What I would need to get started with a real proof of concept
   (data, access, stakeholder buy-in, etc.)
5. Suggested first action to take after this workshop

Keep it to a one-page summary I can share with my team.
```

Save this output — it is your personal workshop takeaway.

---

## Shareback Preparation (2 minutes)

You will have **2 minutes** to share back to the group. Prepare to answer:

1. **What scenario did you explore?** (one sentence)
2. **What did you try with Bob?** (one specific prompt or flow)
3. **What surprised you or worked better than expected?**
4. **What is your most likely next step?**

---

## Inspiration: What Others Have Built

Here are examples of how the autopilot pattern has been adapted to different Planning Analytics scenarios:

| Scenario | Planning Object | External Context | Trigger |
|----------|----------------|-----------------|---------|
| **Sales Performance Autopilot** | Revenue by rep, region, product | CRM deal pipeline and stage | Monthly actuals close |
| **Headcount Variance Monitor** | HC and comp by department | HRIS open positions and attrition data | Bi-weekly payroll run |
| **Capex Tracker** | Project spend vs approved budget | ERP purchase orders and invoices | Weekly actuals posting |
| **Manufacturing Cost Sentinel** | Production costs by plant and line | MES downtime and scrap rates | Daily production close |
| **Marketing ROI Autopilot** | Campaign spend vs pipeline generated | CRM influenced pipeline and attribution | Campaign close |
| **Cash Flow Early Warning** | Cash actuals vs forecast | AP/AR aging from ERP | Daily bank reconciliation |

---

## Tips for a Successful PoC

### Start with what you have

You do not need a perfect dataset to start. A sample CSV with 10–20 rows is enough to build and test the TM1 model structure. Bob can generate realistic sample data if you describe the scenario.

### One cube, one use case

Resist the temptation to model everything at once. Pick your single highest-value variance scenario, build the smallest cube that demonstrates the flow, and prove the concept before expanding.

### The agent is a template

The `fpa-variance-agent.yaml` in `lab-02-fpa-variance-autopilot/assets/` is the monolithic reference agent from Lab 2 — designed to be adapted. For a multi-agent approach, adapt the individual sub-agent YAMLs in `lab-02-3-pa-agent/`, `lab-02-4-crm-erp-agents/`, and `lab-02-5-orchestrator/`. The key sections to change for your scenario are:
- `description` — what your agent monitors
- The variance detection thresholds in `instructions`
- The root cause systems (CRM, ERP, HRIS) and what to query
- The stakeholder routing rules
- The response format fields

### Bob is your co-developer

You do not need to write TI processes, MDX, or agent YAML from scratch. Describe what you need in plain English and let Bob draft it — then review, refine, and run it.

---

## Resources for Continued Learning

| Resource | Link |
|----------|------|
| IBM Planning Analytics Documentation | [ibm.com/docs/en/planning-analytics](https://www.ibm.com/docs/en/planning-analytics) |
| Planning Analytics Building Blocks | [github.com/ibm-self-serve-assets/building-blocks](https://github.com/ibm-self-serve-assets/building-blocks/tree/main/optimize/budget-and-forecasting) |
| watsonx Orchestrate Documentation | [ibm.com/docs/en/watsonx/watson-orchestrate](https://www.ibm.com/docs/en/watsonx/watson-orchestrate) |
| IBM Bob — Getting Started | Contact your IBM account team |
| Workshop Repository | This repository — fork it and use it as your PoC starting point |

---

## Workshop Complete

Thank you for participating. Return to the main session for the group **shareback and wrap-up**.

[← Back to Workshop Home](../README.md)
