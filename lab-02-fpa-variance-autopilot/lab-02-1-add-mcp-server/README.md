# Lab 2.1 — Add the Planning Analytics MCP Server to an Agent

**Duration:** 20 minutes  
**Prerequisite:** Lab 0 (setup) ✅ · Lab 1 (Bob + PA MCP) ✅  
**IBM Docs:**
- [Creating and managing connections](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=credentials-creating-managing-connections)
- [Managing app credentials](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=connections-managing-app-credentials)
- [Managing team credentials](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=credentials-managing-team)
- [Adding MCP server tools to a single agent](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=server-adding-mcp-tools-single-agent)

---

## Goal

Before you can add the Planning Analytics MCP server to an agent, you must first create a **Connection** (defines how to authenticate) and add **Team credentials** (the actual username/password). Then you attach the MCP server to the agent using that connection.

> **UI note:** There is no **Integrations** menu in the current Orchestrate UI. The flow is:
> **Manage → Security → Connections** (create connection + credentials) → **Build → All agents → Toolset → Add tool → MCP server** (use that connection).

By the end of this lab you will have:
- A `planning-analytics-basic` connection created with Basic Auth
- Team credentials (PA username/password) stored against that connection
- The PA MCP server imported into the agent's toolset using that connection
- A live tool call confirmed from the agent Preview panel

---

## Background — Connections vs Credentials

| Concept | What it is | Where managed |
|---------|-----------|---------------|
| **Connection** | Defines the auth method (Basic Auth, API Key, OAuth…) and connection ID | **Manage → Security → Connections** |
| **Team credentials** | The shared username/password stored against a connection — available to all users | **Manage → Security → Team credentials** |
| **Member credentials** | Personal per-user credentials — each user stores their own | **Profile icon → Settings → Member credentials** |

> **Why Team credentials for this workshop?**  
> The Planning Analytics server is a **shared instance** — all participants use the same hostname and credentials provided by the facilitator. Team credentials are shared across all users of the connection, which is exactly right here. Member credentials would require every participant to individually enter their own PA login — use those in production when each analyst has a personal PA account.

---

## Pre-Step 1 — Create the Connection

1. From the main menu, click **Manage → Security**.  
   *(On-premises: use **Manage → Connections**.)*
2. Click the **Connections** tab.
3. Click **Add connection**.
4. Under **Define connection details**, enter:

| Field | Value |
|-------|-------|
| **Connection ID** | `planning-analytics-basic` |
| **Display name** | `Planning Analytics (Basic Auth)` |

5. Click **Next**.
6. Under **Configure draft connection**:
   - **Authentication type** → select **Basic Auth**
   - **Credential type** → select **Team credentials** *(shared by all workshop participants)*
   - Leave SSO off.
7. Click **Next**.
8. Under **Configure live connection**:
   - Click **Paste draft configuration** to copy the draft settings to live.
9. Click **Add connection**.

The connection now appears in the Connections list with a ✅ status indicator.

---

## Pre-Step 2 — Add Team Credentials

Now store the actual Planning Analytics username and password against the connection.

1. Still in **Manage → Security**, click the **Team credentials** tab.
2. Select the **Live** environment (or **Draft** if you want to test first).
3. Click **Add team credential**.
4. In the **Select a connection** dropdown, choose `Planning Analytics (Basic Auth)`.
5. Enter the credentials:

| Field | Value |
|-------|-------|
| **Username** | *(provided by your facilitator)* |
| **Password** | *(provided by your facilitator)* |

6. Click **Connect and save**.

The credential appears in the Team credentials list — status shows the connection name, auth type (Basic Auth), and last updated date.

> **Note:** Team credentials are visible and shared by all users in the workspace — any agent using the `planning-analytics-basic` connection will authenticate with these credentials automatically.

---

## Step 1 — Open the Agent in Build

1. From the main menu, click **Build**.
2. For IBM Cloud environments, select your workspace.
3. Click **All agents**.
4. Select the agent you are building. *(If you haven't created the agent yet — see Lab 2.3. You can also do this step while creating a new agent.)*

---

## Step 2 — Open the Add Tool Panel

1. In the agent editor, scroll to the **Toolset** section.
2. Click **Add tool**.
3. Click **MCP server**.

The **Add tools and manage MCP servers** window opens.

---

## Step 3 — Add the Remote MCP Server

1. Click **Add MCP server**.
2. Select **Remote MCP server** and click **Next**.
3. Fill in the server details:

| Field | Value |
|-------|-------|
| **Name** | `planning-analytics-mcp` |
| **Description** | IBM Planning Analytics TM1 tools via MCP |
| **Server URL** | `http://<TECHZONE_HOST>:<PORT>/api/<TENANT_ID>/v0/agentic-ai/cube/mcp` |
| **Transport type** | `Streamable HTTP` *(selected by default)* |

> Your facilitator will provide the exact MCP URL for the shared TechZone Planning Analytics server.

4. **Select the connection:**
   - In the **Connection** dropdown, select `Planning Analytics (Basic Auth)`.
   - This uses the team credentials you added in Pre-Step 2 — no need to re-enter the password.

5. Click **Connect**.

   ✅ Success: a notification confirms *"MCP server is ready and tools are available."*  
   ❌ Failure: see [Troubleshooting](#troubleshooting) below.

---

## Step 4 — Select and Import PA Tools

1. After connecting, click the **search icon** (🔍) in the server search field.
2. Select `planning-analytics-mcp` from the list.
3. The tool list appears. Select all of the following tools:

| Tool name | Description |
|-----------|-------------|
| `get_available_tm1_servers` | Lists all TM1 server instances |
| `list_cubes_with_ai_analysis_metadata` | Lists cubes with pre-analysis status |
| `get_cube_dimensions` | Returns dimensions for a named cube |
| `get_cube_sample_members` | Returns sample members for a dimension |
| `get_data_from_data_explorer` | Natural language data query (pre-analyzed cubes) |
| `execute_mdx_and_get_view` | Runs a raw MDX query |
| `get_cubes_that_may_answer_query` | Finds cubes matching a natural language query |
| `lookup_potential_members` | Finds dimension members by partial name |
| `perform_outlier_detection` | Statistical outlier detection on a cube slice |
| `get_outlier_summary` | Summarises outlier detection results |

4. Click **Add to agent**.

The tools now appear in the agent's **Toolset** section.

> **Tip:** Click any tool name to expand its input/output schema. The `description` field is what the agent model reads to decide *when* to call the tool — good descriptions lead to better reasoning.

---

## Step 5 — Test a Tool Call from Preview

1. In the agent editor, click **Preview** (chat panel on the right).
2. Send:

```
List all available TM1 servers.
```

**Expected:** The agent calls `get_available_tm1_servers` and returns `["DemoGuide"]`.

3. Send:

```
Show me the dimensions of the FPA_Variance cube on DemoGuide.
```

**Expected:** The agent calls `get_cube_dimensions` and returns:
```
Account · Department · Scenario · Time · Version
```

Both working = connection, credentials, and MCP import all confirmed end-to-end.

---

## ✅ Checkpoint

Before moving to Lab 2.2, confirm:

- [ ] `planning-analytics-basic` connection created (Basic Auth, Team credentials)
- [ ] Team credentials added — PA username + password stored in Live environment
- [ ] Remote MCP server `planning-analytics-mcp` added with **Streamable HTTP** transport
- [ ] Connection `Planning Analytics (Basic Auth)` selected during MCP server setup
- [ ] All 10 PA tools appear in the agent's Toolset
- [ ] `get_available_tm1_servers` returns `DemoGuide` from the Preview panel
- [ ] `get_cube_dimensions` returns 5 dimensions for `FPA_Variance`

---

## ADK Alternative

```bash
# Install the ADK
pip install ibm-watsonx-orchestrate

# Authenticate
orchestrate env add --env-name workshop \
  --url https://<YOUR_ORCHESTRATE_TENANT>.ai.ibm.com \
  --api-key <YOUR_API_KEY>
orchestrate env activate workshop

# Register the MCP server with Basic Auth inline
orchestrate tools import \
  --kind mcp \
  --url http://<TECHZONE_HOST>:<PORT>/api/<TENANT_ID>/v0/agentic-ai/cube/mcp \
  --name planning-analytics-mcp \
  --auth-type basic \
  --username <USER> \
  --password <PASSWORD>

# Verify tools were discovered
orchestrate tools list | grep planning-analytics-mcp
```

---

## Troubleshooting

**Can't find Manage → Security**  
→ This path is available on AWS and IBM Cloud tenants. On-premises: use **Manage → Connections** instead. Both lead to the same Connections and Credentials tabs.

**Connection ID already exists**  
→ Someone else in the workshop already created it. Click the existing `planning-analytics-basic` connection and verify it has Basic Auth + Team credentials set. If correct, skip Pre-Steps 1–2 and go straight to Step 3.

**"Connect" fails on the MCP server**  
→ Verify the team credential is set to the **Live** environment (not just Draft).  
→ Verify the MCP URL — no trailing slash, correct port, correct tenant ID segment.  
→ Open the URL in a browser — a valid MCP endpoint returns a JSON response.

**Tool list is empty after a successful connection**  
→ The MCP server connected but reported no tools. Check with your facilitator that the agentic-AI / MCP endpoint is enabled on the TechZone instance.

**Only SSE is available (no Streamable HTTP)**  
→ Select **Server-Sent Events (SSE)** as the transport type instead. The URL and credentials remain the same.

**`get_available_tm1_servers` returns an auth error in Preview**  
→ Confirm the team credential status shows ✅ in the Live environment under **Manage → Security → Team credentials**.  
→ If it shows ❌, click the Options menu → **Edit** and re-enter the password.

---

## Next

→ **[Lab 2.2 — Import SalesLens REST API as CRM & ERP Tools](../lab-02-2-import-rest-api-tools/README.md)**
