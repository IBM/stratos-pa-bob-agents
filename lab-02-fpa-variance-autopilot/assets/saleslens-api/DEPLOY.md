# SalesLens API — Deploy Guide

> **Setup:** Mac M4 · ICR namespace `sales-lens-workshop` in personal IBM Cloud account (`eu-de`) · Code Engine project `ce-3100014vn6` in workshop account

---

## Prerequisites (one-time)

```bash
# Install IBM Cloud plugins if missing
ibmcloud plugin install container-registry
ibmcloud plugin install code-engine
```

### Variables — set once per terminal session

```bash
ICR_NAMESPACE=sales-lens-workshop
ICR_REGION=de.icr.io
IMAGE=${ICR_REGION}/${ICR_NAMESPACE}/saleslens:1.0.0
CE_PROJECT=ce-3100014vn6
APP_DIR=lab-02-fpa-variance-autopilot/assets/saleslens-api
```

---

## Part 1 — Build & Test Locally

### 1a — Build (Mac M4 → linux/amd64)

```bash
cd $APP_DIR

docker buildx build --platform linux/amd64 --tag ${IMAGE} --load .
```

> If you see `error: no builder`, run once: `docker buildx create --name multiarch --use`

### 1b — Run locally

```bash
docker run -d \
  --name saleslens-test \
  -p 8080:8080 \
  -e API_KEY=workshop-demo-key \
  saleslens:latest
```

### 1c — Verify

```bash
# Health check
curl http://localhost:8080/health

# CRM endpoint
curl -H "X-Api-Key: workshop-demo-key" \
  "http://localhost:8080/crm/variance-context?dept_id=DEPT-NA-SALES&period=2024-01"

# ERP endpoint
curl -H "X-Api-Key: workshop-demo-key" \
  "http://localhost:8080/erp/cost-context?dept_id=DEPT-NA-SALES&period=2024-01"

# Full smoke test suite
node test/smoke-test.js
```

Open **http://localhost:8080** → lands on Demo UI.

### 1d — Stop

```bash
docker stop saleslens-test && docker rm saleslens-test
```

---

## Part 2 — Push to Container Registry

> Runs in your **personal IBM Cloud account** where the `sales-lens-workshop` ICR namespace lives.

### 2a — Login to personal account + ICR

```bash
ibmcloud login --sso          # select PERSONAL account
ibmcloud target -r eu-de
ibmcloud cr region-set eu-de
ibmcloud cr login
```

### 2b — Build with full ICR tag and push

```bash
cd $APP_DIR

docker buildx build --platform linux/amd64 --tag ${IMAGE} --load .
docker push ${IMAGE}

# Verify
ibmcloud cr image-list | grep saleslens
```

---

## Part 3 — Create App in Code Engine

> Runs in the **workshop IBM Cloud account** where Code Engine project `ce-3100014vn6` lives.

### 3a — Switch to workshop account

```bash
ibmcloud login --sso          # select WORKSHOP account
ibmcloud target -r eu-de
ibmcloud ce project select --name ${CE_PROJECT}
```

### 3b — Create registry secret (one-time)

Code Engine needs an IAM API key from your personal account to pull the image from ICR.

**Generate the key — switch to personal account:**
```bash
ibmcloud login --sso          # select PERSONAL account
ibmcloud iam api-key-create ce-icr-pull-key \
  --description "Code Engine cross-account pull key for ICR" \
  --output json | grep '"apikey"'
# ⚠️  Copy the apikey value — do not share or commit it
```

**Create the secret — switch back to workshop account:**
```bash
ibmcloud login --sso          # select WORKSHOP account
ibmcloud target -r eu-de
ibmcloud ce project select --name ${CE_PROJECT}

ibmcloud ce registry create \
  --name icr-secret \
  --server de.icr.io \
  --username iamapikey \
  --password <paste-api-key>
```

### 3c — Deploy

```bash
ibmcloud ce application create \
  --name saleslens-api \
  --image ${IMAGE} \
  --registry-secret icr-secret \
  --port 8080 \
  --min-scale 1 \
  --max-scale 2 \
  --cpu 0.25 \
  --memory 0.5G \
  --env API_KEY=workshop-demo-key \
  --env NODE_ENV=production
```

> `--min-scale 1` keeps one warm instance — no cold-start delay during the workshop.

### 3d — Get the public URL

```bash
ibmcloud ce application get --name saleslens-api --output url
```

URL format:
```
https://saleslens-api.<random>.eu-de.codeengine.appdomain.cloud
```

**Share the URL + API key with participants** — they need both for the Orchestrate tool setup in Lab 2.

### 3e — Validate live deployment

```bash
BASE_URL=$(ibmcloud ce application get --name saleslens-api --output url) \
API_KEY=workshop-demo-key \
node test/smoke-test.js
```

---

## Updating the Deployment

```bash
# 1 — Bump the tag
IMAGE=de.icr.io/sales-lens-workshop/saleslens:1.0.1

# 2 — Rebuild & push (personal account)
ibmcloud login --sso          # select PERSONAL account
ibmcloud target -r eu-de && ibmcloud cr login
docker buildx build --platform linux/amd64 --tag ${IMAGE} --load .
docker push ${IMAGE}

# 3 — Update app (workshop account)
ibmcloud login --sso          # select WORKSHOP account
ibmcloud target -r eu-de
ibmcloud ce project select --name ce-3100014vn6
ibmcloud ce application update --name saleslens-api --image ${IMAGE}
```

---

## Quick Reference

| | Value |
|---|---|
| ICR namespace | `sales-lens-workshop` |
| ICR endpoint | `de.icr.io` (Frankfurt) |
| Image | `de.icr.io/sales-lens-workshop/saleslens:1.0.0` |
| Code Engine project | `ce-3100014vn6` |
| App name | `saleslens-api` |
| Port | `8080` |
| API Key env var | `API_KEY=workshop-demo-key` |

---

*Part of the Planning Analytics × Bob × watsonx Orchestrate Workshop — Lab 2: FP&A Variance Autopilot*
