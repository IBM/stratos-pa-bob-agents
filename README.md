# Planning Analytics, Bob & watsonx Orchestrate Workshop

## AI-Powered Planning Experiences for FP&A Teams

---

This hands-on workshop demonstrates how **IBM Bob**, **IBM Planning Analytics (TM1)**, and **IBM watsonx Orchestrate** work together to build intelligent, AI-powered planning experiences. Participants will move from foundational concepts to working labs — finishing the day with practical skills they can apply to their own Finance & Planning use cases.

**Duration:** 6 hours (full day)
**Format:** Instructor-led with hands-on lab exercises
**Level:** Intermediate

---

## Workshop Overview

| # | Session | Duration |
|---|---------|----------|
| — | Welcome, introductions, and objectives | 10 min |
| — | watsonx Orchestrate overview | 30 min |
| — | Bob overview: Planning Analytics assistant experience | 30 min |
| — | Environment access validation | 20 min |
| — | *Break* | *20 min* |
| [Lab 0](./lab-00-setup/README.md) | Environment setup & MCP configuration | 15 min |
| [Lab 1](./lab-01-bob-planning-analytics-mcp/README.md) | **Hands-On Lab 1:** Bob + Planning Analytics via MCP | 45 min |
| — | Use case overview: FP&A Variance Autopilot | 15 min |
| — | *Lunch / Break* | *60 min* |
| [Lab 2](./lab-02-fpa-variance-autopilot/README.md) | **Hands-On Lab 2:** FP&A Variance Autopilot | 60 min |
| [Lab 3](./lab-03-bring-your-own-usecase/README.md) | Adapt the autopilot to your own use case | 30 min |
| — | Shareback: participant ideas and discussion | 10 min |
| — | Wrap-up, next steps, and Q&A | 10 min |

---

## Learning Objectives

By the end of this workshop, you will be able to:

- Understand how **watsonx Orchestrate** enables agentic workflows for enterprise finance
- Understand how **Bob** simplifies Planning Analytics development and analysis through conversational AI
- Configure a **Planning Analytics MCP connection** in Bob to interact with TM1 data using natural language
- Build and query a **TM1 cube** from CSV data using Bob's Planning Analytics mode
- Run a complete **FP&A Variance Autopilot** — detecting variances, investigating root causes, generating AI explanations, and writing findings back to Planning Analytics
- Adapt the autopilot pattern to your own Planning Analytics scenario

---

## Prerequisites

Before attending the workshop, ensure the following access is confirmed:

| Requirement | Details |
|-------------|---------|
| **IBM Bob** | Access with minimum 200 coins — confirm with your workshop organiser |
| **IBM Planning Analytics** | TechZone-provisioned environment — URL and credentials shared ahead of the session |
| **watsonx Orchestrate** | Trial access or IBM SaaS tenant — confirm with your workshop organiser |
| **VS Code** | Latest version with the **IBM Bob extension** installed |
| **Laptop** | macOS or Windows with internet access |

> **Access Clarification:** TechZone Planning Analytics environments will be shared with participants before the session. Bob and Orchestrate access models should be confirmed with the workshop organiser in advance.

---

## Repository Structure

```
pa-bob-orchestrate-workshop/
├── README.md                          ← You are here
├── FACILITATOR_GUIDE.md               ← Facilitator notes and timing guidance
│
├── lab-00-setup/
│   └── README.md                      ← Environment setup and MCP configuration
│
├── lab-01-bob-planning-analytics-mcp/
│   ├── README.md                      ← Lab 1 instructions
│   └── assets/
│       └── mcp.json                   ← MCP server configuration template
│
├── lab-02-fpa-variance-autopilot/
│   ├── README.md                      ← Lab 2 instructions
│   └── assets/
│       ├── fpa-variance-agent.yaml    ← watsonx Orchestrate agent definition
│       ├── dim_account.csv            ← Account dimension data
│       ├── dim_department.csv         ← Department dimension data
│       ├── dim_scenario.csv           ← Scenario dimension data
│       ├── dim_time.csv               ← Time dimension data
│       ├── dim_version.csv            ← Version dimension data
│       └── fact_financial_data.csv    ← Financial fact data
│
└── lab-03-bring-your-own-usecase/
    └── README.md                      ← Guidance for adapting to your own scenario
```

---

## Featured Use Cases

### Use Case 1 — Bob + Planning Analytics via MCP
Bob uses the **Planning Analytics MCP integration** to interact with your TM1 environment through natural language. You can build TM1 models from CSV files, query cubes, perform variance analysis, detect outliers, and automate TurboIntegrator processes — all through conversation.

### Use Case 2 — FP&A Variance Autopilot
A **watsonx Orchestrate agent** monitors Planning Analytics for material budget variances (>$100K or >20%). When a variance is detected, the agent investigates root causes, generates a plain-language explanation, writes it back to Planning Analytics as a cell annotation, and routes context-rich alerts to the right stakeholders — in under 5 minutes.

---

## Expected Outcomes

| Outcome | Delivered By |
|---------|-------------|
| Understand Orchestrate's role in agentic FP&A workflows | Presentation + Lab 2 |
| Understand how Bob supports PA development and analysis | Presentation + Lab 1 |
| Configure MCP and query TM1 using natural language | Lab 0 + Lab 1 |
| Build a TM1 cube from CSV data via Bob | Lab 1 |
| Run end-to-end variance detection and explanation | Lab 2 |
| Adapt the autopilot to your own Planning Analytics use case | Lab 3 |

---

## Additional Resources

- [IBM Planning Analytics Documentation](https://www.ibm.com/docs/en/planning-analytics)
- [watsonx Orchestrate Documentation](https://www.ibm.com/docs/en/watsonx/watson-orchestrate)
- [IBM Bob — Getting Started](https://www.ibm.com/products/bob)
- [IBM Planning Analytics MCP Tools Reference](./lab-01-bob-planning-analytics-mcp/README.md#mcp-tools-reference)

---

> **Made with IBM Bob** · Planning Analytics × watsonx Orchestrate Workshop · Version 1.0
