// FP&A context console — vanilla JS, no build step.
// Talks to the mock CRM/ERP API described in the Lab 2 README.

const state = {
  base: localStorage.getItem('fpa_api_base') || '',
  key: localStorage.getItem('fpa_api_key') || '',
};

// ---------- helpers ----------

function fmtMoney(n) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return '$' + Number(n).toLocaleString('en-US');
}

async function apiGet(path, params = {}) {
  const url = new URL(state.base.replace(/\/$/, '') + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: { 'X-Api-Key': state.key },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
  }
  return res.json();
}

function renderRows(tbody, rows, columns, emptyMessage) {
  tbody.innerHTML = '';
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${columns.length}">${emptyMessage}</td></tr>`;
    return;
  }
  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = columns.map(c => `<td class="${c.num ? 'num' : ''}">${c.render(row)}</td>`).join('');
    tbody.appendChild(tr);
  }
}

// ---------- connection ----------

const connDot = document.getElementById('connDot');
const connLabel = document.getElementById('connLabel');
const apiBaseInput = document.getElementById('apiBase');
const apiKeyInput = document.getElementById('apiKey');

apiBaseInput.value = state.base;
apiKeyInput.value = state.key;

async function checkHealth() {
  if (!state.base) {
    connDot.className = 'dot';
    connLabel.textContent = 'Not connected';
    return;
  }
  try {
    const res = await fetch(state.base.replace(/\/$/, '') + '/health');
    if (!res.ok) throw new Error();
    const data = await res.json().catch(() => ({}));
    connDot.className = 'dot is-live';
    connLabel.textContent = 'Connected';
    document.getElementById('statService').textContent = data.service || data.status || 'ok';
    document.getElementById('statEnv').textContent = data.environment || data.env || '—';
  } catch {
    connDot.className = 'dot is-down';
    connLabel.textContent = 'Unreachable';
  }
}

document.getElementById('saveConn').addEventListener('click', () => {
  state.base = apiBaseInput.value.trim();
  state.key = apiKeyInput.value.trim();
  localStorage.setItem('fpa_api_base', state.base);
  localStorage.setItem('fpa_api_key', state.key);
  checkHealth();
});

// ---------- view routing ----------

const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(b => b.classList.remove('is-active'));
    views.forEach(v => v.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.getElementById('view-' + btn.dataset.view).classList.add('is-active');
  });
});

// ---------- variance lookup (hero) ----------

document.getElementById('lookupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const params = {
    dept_id: form.get('dept_id'),
    period: form.get('period'),
    account_id: form.get('account_id') || undefined,
  };

  const crmSummary = document.querySelector('#crmContext .context-summary');
  const erpSummary = document.querySelector('#erpContext .context-summary');
  const crmFigures = document.getElementById('crmFigures');
  const erpFigures = document.getElementById('erpFigures');

  crmSummary.textContent = 'Loading…';
  erpSummary.textContent = 'Loading…';
  crmFigures.innerHTML = '';
  erpFigures.innerHTML = '';

  try {
    const crm = await apiGet('/crm/variance-context', params);
    crmSummary.removeAttribute('data-state');
    crmSummary.textContent = crm.context_summary || 'No revenue-side context for this combination.';
    crmFigures.innerHTML = `
      <div class="context-figure">Slipped value<strong>${fmtMoney(crm.total_slipped_value)}</strong></div>
      <div class="context-figure">Open pipeline<strong>${fmtMoney(crm.pipeline_summary?.open_pipeline)}</strong></div>
      <div class="context-figure">Coverage ratio<strong>${crm.pipeline_summary?.coverage_ratio ?? '—'}</strong></div>
    `;
  } catch (err) {
    crmSummary.textContent = `Could not load CRM context: ${err.message}`;
  }

  try {
    const erp = await apiGet('/erp/cost-context', params);
    erpSummary.removeAttribute('data-state');
    erpSummary.textContent = erp.context_summary || 'No cost-side context for this combination.';
    erpFigures.innerHTML = `
      <div class="context-figure">Unplanned cost<strong>${fmtMoney(erp.total_unplanned_cost)}</strong></div>
      <div class="context-figure">POs<strong>${erp.unbudgeted_purchase_orders?.length ?? 0}</strong></div>
      <div class="context-figure">Headcount events<strong>${erp.unbudgeted_headcount_events?.length ?? 0}</strong></div>
    `;
  } catch (err) {
    erpSummary.textContent = `Could not load ERP context: ${err.message}`;
  }
});

// ---------- deals ----------

document.getElementById('dealsFilter').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const tbody = document.querySelector('#dealsTable tbody');
  try {
    const data = await apiGet('/crm/deals', Object.fromEntries(form));
    const rows = Array.isArray(data) ? data : data.deals || [];
    renderRows(tbody, rows, [
      { render: r => r.account_name || r.account_id || '—' },
      { render: r => r.status || '—' },
      { num: true, render: r => fmtMoney(r.value) },
      { render: r => r.reason || r.notes || '—' },
    ], 'No deals match those filters.');
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">${err.message}</td></tr>`;
  }
});

// ---------- pipeline ----------

document.getElementById('pipelineFilter').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const grid = document.getElementById('pipelineStats');
  grid.innerHTML = '<p class="hint">Loading…</p>';
  try {
    const data = await apiGet('/crm/pipeline-summary', Object.fromEntries(form));
    grid.innerHTML = `
      <div class="stat-card"><span class="stat-label">Open pipeline</span><span class="stat-value">${fmtMoney(data.open_pipeline)}</span></div>
      <div class="stat-card"><span class="stat-label">Coverage ratio</span><span class="stat-value">${data.coverage_ratio ?? '—'}</span></div>
      <div class="stat-card"><span class="stat-label">At-risk value</span><span class="stat-value">${fmtMoney(data.at_risk_value)}</span></div>
      <div class="stat-card"><span class="stat-label">Deal count</span><span class="stat-value">${data.deal_count ?? '—'}</span></div>
    `;
  } catch (err) {
    grid.innerHTML = `<p class="hint">${err.message}</p>`;
  }
});

// ---------- purchase orders ----------

document.getElementById('posFilter').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const tbody = document.querySelector('#posTable tbody');
  try {
    const data = await apiGet('/erp/purchase-orders', Object.fromEntries(form));
    const rows = Array.isArray(data) ? data : data.purchase_orders || [];
    renderRows(tbody, rows, [
      { render: r => r.vendor || '—' },
      { render: r => r.po_number || r.po_id || '—' },
      { render: r => r.category || '—' },
      { num: true, render: r => fmtMoney(r.amount) },
      { render: r => r.reason || r.notes || '—' },
    ], 'No purchase orders match those filters.');
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">${err.message}</td></tr>`;
  }
});

// ---------- headcount ----------

document.getElementById('headcountFilter').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const tbody = document.querySelector('#headcountTable tbody');
  try {
    const data = await apiGet('/erp/headcount-events', Object.fromEntries(form));
    const rows = Array.isArray(data) ? data : data.headcount_events || [];
    renderRows(tbody, rows, [
      { render: r => r.role || r.title || '—' },
      { render: r => r.event_type || '—' },
      { num: true, render: r => fmtMoney(r.monthly_cost) },
      { render: r => r.reason || r.notes || '—' },
    ], 'No headcount events match those filters.');
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">${err.message}</td></tr>`;
  }
});

// ---------- init ----------

checkHealth();
