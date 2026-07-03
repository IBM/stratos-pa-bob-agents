#!/usr/bin/env node
'use strict';

/**
 * Smoke test — validates all key API endpoints are responding correctly.
 * Run after local start or after Code Engine deployment.
 *
 * Usage:
 *   BASE_URL=https://your-app.codeengine.appdomain.cloud \
 *   API_KEY=workshop-demo-key \
 *   node test/smoke-test.js
 */

const http  = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const API_KEY  = process.env.API_KEY  || 'workshop-demo-key';

const isHttps = BASE_URL.startsWith('https');
const client  = isHttps ? https : http;

let passed = 0;
let failed = 0;

function request(path, expectStatus = 200, useAuth = true) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    const options = { headers: useAuth ? { 'X-Api-Key': API_KEY } : {} };

    client.get(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const ok = res.statusCode === expectStatus;
        const symbol = ok ? '✅' : '❌';
        console.log(`${symbol} [${res.statusCode}] ${path}`);
        if (!ok) {
          console.log(`   Expected ${expectStatus}, got ${res.statusCode}`);
          console.log(`   Body: ${body.slice(0, 200)}`);
          failed++;
        } else {
          passed++;
        }
        resolve({ status: res.statusCode, body });
      });
    }).on('error', (err) => {
      console.log(`❌ [ERR] ${path} — ${err.message}`);
      failed++;
      resolve({ status: 0, body: err.message });
    });
  });
}

async function runTests() {
  console.log(`\nFP&A Mock API — Smoke Tests`);
  console.log(`Base URL : ${BASE_URL}`);
  console.log(`─────────────────────────────────────────\n`);

  // Health (no auth)
  await request('/health', 200, false);
  await request('/',       200, false);

  // Auth enforcement
  await request('/crm/deals', 401, false);  // no key → 401

  // CRM endpoints
  await request('/crm/deals?dept_id=DEPT-NA-SALES&period=2024-01');
  await request('/crm/deals?dept_id=DEPT-NA-SALES&period=2024-01&status=slipped');
  await request('/crm/pipeline-summary?dept_id=DEPT-NA-SALES&period=2024-01');
  await request('/crm/variance-context?dept_id=DEPT-NA-SALES&period=2024-01&account_id=REV-001');
  await request('/crm/variance-context?dept_id=DEPT-EMEA-SALES&period=2024-01');
  await request('/crm/variance-context?dept_id=DEPT-APAC-SALES&period=2024-03');

  // ERP endpoints
  await request('/erp/purchase-orders?dept_id=DEPT-NA-SALES&period=2024-01');
  await request('/erp/headcount-events?dept_id=DEPT-NA-SALES&period=2024-01');
  await request('/erp/cost-context?dept_id=DEPT-NA-SALES&period=2024-01&account_id=OPEX-001');
  await request('/erp/cost-context?dept_id=DEPT-PROD-ENG&period=2025-03');

  // 404 check
  await request('/crm/nonexistent', 404);

  // OpenAPI spec
  await request('/api-spec');

  console.log(`\n─────────────────────────────────────────`);
  console.log(`Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
