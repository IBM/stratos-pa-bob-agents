# Your Scenario

**Duration:** 15 minutes  
**Format:** Facilitated discussion — no hands-on required  
**Prerequisite:** [Lab 2](../lab-02-fpa-variance-autopilot/README.md) ✅ completed

---

## What This Session Is

You have built the FP&A Variance Autopilot. Now map the same pattern to your own organisation. A facilitator will circulate. Bob is open.

---

## Inspiration — What Others Have Built

Use this table to spark ideas before you fill in the canvas below.

| Scenario | Planning Object | Root Cause System | Trigger |
|----------|----------------|-------------------|---------|
| Sales Performance Autopilot | Revenue by rep, region, product | CRM deal pipeline | Monthly actuals close |
| Headcount Variance Monitor | HC and comp by department | HRIS attrition + open positions | Bi-weekly payroll run |
| Capex Tracker | Project spend vs approved budget | ERP purchase orders + invoices | Weekly actuals posting |
| Manufacturing Cost Sentinel | Production costs by plant | MES downtime and scrap rates | Daily production close |
| Marketing ROI Autopilot | Campaign spend vs pipeline | CRM influenced pipeline | Campaign close |
| Cash Flow Early Warning | Cash actuals vs forecast | AP/AR aging from ERP | Daily bank reconciliation |

---

## The Canvas (5 minutes)

Answer these three questions for a Planning Analytics use case from your own work. One sentence each. Write them down — you will paste them into Bob next.

**1. What is the planning object?**
> The cube / data you would monitor.  
> *e.g. Headcount and comp by department · Capex by project · Manufacturing costs by plant*

**2. What is the variance story?**
> The comparison that matters.  
> *e.g. Budget vs Actual at month-end · Forecast vs Actual mid-month · YoY performance*

**3. Where does the root cause live?**
> The external system that explains the variance.  
> *e.g. HRIS (open positions, attrition) · ERP (POs, invoices) · Operations (downtime, yield)*

---

## The Bob Prompt (8 minutes)

Paste this into Bob with your three answers filled in:

```
I want to adapt the FP&A Variance Autopilot for my own scenario:

- Planning object: [your answer to Q1]
- Variance story:  [your answer to Q2]
- Root cause system: [your answer to Q3]

Based on this:
1. What would the agent description look like for this use case?
2. What are the 2–3 most important changes to make to the
   orchestrator agent instructions?
3. What external API or data source would I need to connect?

Keep it concise — one paragraph per answer.
```

Bob's response is your starting point for a real PoC. Save it.

---

## Resources — Take These Away

| Resource | Link |
|----------|------|
| IBM Planning Analytics Documentation | [ibm.com/docs/en/planning-analytics](https://www.ibm.com/docs/en/planning-analytics) |
| watsonx Orchestrate Documentation | [ibm.com/docs/en/watsonx/watson-orchestrate](https://www.ibm.com/docs/en/watsonx/watson-orchestrate) |
| Planning Analytics Building Blocks | [github.com/ibm-self-serve-assets/building-blocks](https://github.com/ibm-self-serve-assets/building-blocks/tree/main/optimize/budget-and-forecasting) |
| Workshop Repository | Fork this repo and use it as your PoC starting point |
| Agent YAMLs to adapt | `lab-02-3-pa-agent/`, `lab-02-4-crm-erp-agents/`, `lab-02-5-orchestrator/` |

---

[← Back to Workshop Home](../README.md)
