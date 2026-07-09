# Lab 2.6 (Optional) — Embed the Autopilot in an HTML Chat Interface

**Duration:** 15 minutes  
**Prerequisite:** Lab 2.5 ✅ (orchestrator agent active)  
**Reference:** [developer.watson-orchestrate.ibm.com](https://developer.watson-orchestrate.ibm.com)

---

## Goal

Open the pre-built HTML chat interface (`saleslens-crm-erp.html`), connect it to your running Orchestrate agent, and send variance queries directly from a browser — no Orchestrate UI required.

By the end of this lab you will have:
- `saleslens-crm-erp.html` running locally in a browser
- The FP&A Variance Autopilot answering questions from a plain HTML chat UI
- Understanding of the Orchestrate REST API `/v1/chat` endpoint

---

## Background — The `/v1/chat` REST Endpoint

Every watsonx Orchestrate agent exposes a REST endpoint. The `saleslens-crm-erp.html` page calls it directly from the browser using a Bearer token:

```
POST https://<YOUR_TENANT>.ai.ibm.com/v1/chat
Authorization: Bearer <IBM_CLOUD_IAM_TOKEN>
Content-Type: application/json

{
  "agent_id": "fpa_variance_autopilot",
  "messages": [{ "role": "user", "content": "Run variance analysis for Jan 2024" }]
}
```

This is the same API used by CI/CD pipelines, TurboIntegrator processes, and Power Automate flows — the chat embed is just a visible wrapper around it.

---

## Step 1 — Generate an IBM Cloud IAM Token

```bash
# Log in to IBM Cloud
ibmcloud login --sso

# Get your OAuth token
ibmcloud iam oauth-tokens
```

Copy the value after `IAM token:` — this is your Bearer token. It is valid for ~60 minutes.

> **Alternative:** Generate a long-lived API key-based token:
> ```bash
> curl -X POST https://iam.cloud.ibm.com/identity/token \
>   -H "Content-Type: application/x-www-form-urlencoded" \
>   -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=<YOUR_API_KEY>" \
>   | jq -r '.access_token'
> ```

---

## Step 2 — Open the Chat Page

Open the file in your browser:

```bash
# macOS
open lab-02-fpa-variance-autopilot/lab-02-6-chat-embed/saleslens-crm-erp.html

# Windows
start lab-02-fpa-variance-autopilot/lab-02-6-chat-embed/saleslens-crm-erp.html

# Or drag the file into any browser window
```

The **Configure** panel opens automatically on first load.

---

## Step 3 — Configure the Connection

Fill in the three fields:

| Field | Value |
|-------|-------|
| **Tenant URL** | `https://<YOUR_TENANT>.ai.ibm.com` (no trailing slash) |
| **Bearer Token** | The IAM token from Step 1 |
| **Agent ID** | `fpa_variance_autopilot` |

Click **Save & Connect**. The status dot in the top-right turns **green** when the configuration is saved.

> Configuration is persisted in `localStorage` — you only need to fill this in once per browser session. Token refresh is needed every ~60 minutes.

---

## Step 4 — Send a Query

Click one of the suggestion pills or type in the input box:

```
Run the FP&A variance analysis for January 2024.
```

The interface sends the message to your Orchestrate agent and displays the response in the chat panel.

**Try these prompts:**

```
Run variance analysis for January 2024 on the FPA_Variance cube.
Analyse March 2024 APAC Sales variances.
Show all material OpEx variances for Q1 2024.
Explain the NA Sales revenue miss in January 2024.
```

---

## How the Page Works

```
[User types message]
        │
        ▼
POST /v1/chat  ──→  watsonx Orchestrate
  agent_id: fpa_variance_autopilot          │
  messages: [{ role: user, content: ... }]  │
        │                                   ▼
        │              FP&A Variance Autopilot (Orchestrator)
        │                     ├── pa_data_agent
        │                     ├── crm_context_agent
        │                     └── erp_context_agent
        │                                   │
        └───────── response.output.text ────┘
                        │
                        ▼
                [Displayed in chat bubble]
```

The page is entirely self-contained — one HTML file, no npm, no build step, no framework.

---

## Customising the Embed

The file [`saleslens-crm-erp.html`](saleslens-crm-erp.html) is a single self-contained HTML file co-located in this folder. Common customisations:

**Change the agent title:**
```html
<h1>FP&amp;A Variance Autopilot</h1>   ← update this line in the header
```

**Add or change suggestion pills:**
```html
<button class="suggestion-btn">Run variance analysis for January 2024</button>
```

**Change the colour scheme:**  
Edit the CSS variables at the top of the `<style>` block:
```css
background: #ffffff;   ← page background
color: #1f2328;        ← text colour
```

**Embed in an existing page:**  
Copy the `<style>`, `<body>` content, and `<script>` block into any HTML page. The chat occupies its parent container.

---

## CORS Note

If you see a CORS error in the browser console, the request is being blocked by the browser's same-origin policy. Options:

1. **Use a server-side proxy:** Route requests through a local Express server that forwards to Orchestrate and sets the correct CORS headers. A minimal proxy:

```javascript
// proxy.js  (run with: node proxy.js)
const express = require('express');
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.post('/v1/chat', async (req, res) => {
  const fetch = (await import('node-fetch')).default;
  const upstream = await fetch('https://<YOUR_TENANT>.ai.ibm.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': req.headers.authorization,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });
  const data = await upstream.json();
  res.json(data);
});
app.use(express.static('.'));
app.listen(3000, () => console.log('Proxy running on http://localhost:3000'));
```

Then change the tenant URL in the chat config to `http://localhost:3000`.

2. **Use the IBM Orchestrate embed widget:** Some Orchestrate tenants provide a dedicated embeddable chat widget with CORS handled server-side. Ask your facilitator.

---

## ✅ Checkpoint

- [ ] `saleslens-crm-erp.html` opens in a browser without errors
- [ ] Configure panel filled in with tenant URL, token, and agent ID
- [ ] Status dot turns green after saving
- [ ] At least one variance query returns a response from the orchestrator
- [ ] Response includes PA data + CRM/ERP root cause text

---

## Troubleshooting

**Config panel keeps re-opening**  
→ The page opens the config on first load if the tenant URL is empty. Fill in all three fields and click Save.

**Status dot stays grey after saving**  
→ This is normal — the status dot turns green after a successful Save (not after a successful API call). Check the browser console for errors on the first message send.

**Response shows `Error: 401`**  
→ Your IAM token has expired (valid ~60 minutes). Re-run `ibmcloud iam oauth-tokens` and update the token in Configure.

**Response shows `Error: 404`**  
→ The agent ID is wrong. Check `orchestrate agents list` for the exact name.

**Response shows raw JSON instead of formatted text**  
→ The Orchestrate API response shape may differ by tenant version. Check the browser console for the raw response and update the extraction logic in the `<script>`:
```javascript
const reply = data?.output?.text || data?.choices?.[0]?.message?.content || data?.response;
```

---

## Next

You have completed all sub-labs in the FP&A Variance Autopilot series.

→ **[Return to Lab 2 overview](../README.md)**  
→ **[Continue to Lab 3 — Bring Your Own Use Case](../../lab-03-bring-your-own-usecase/README.md)**
