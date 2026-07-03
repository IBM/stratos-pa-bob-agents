'use strict';

const express = require('express');
const router  = express.Router();
const store   = require('../data/crm-data');

// ── GET /crm/deals ────────────────────────────────────────────────────────────
router.get('/deals', (req, res) => {
  const { dept_id, period, status, account_id, search } = req.query;
  let results = [...store.deals];
  if (dept_id)    results = results.filter(d => d.dept_id === dept_id);
  if (period)     results = results.filter(d => d.period_impacted === period);
  if (status)     results = results.filter(d => d.status === status);
  if (account_id) results = results.filter(d => d.account_id === account_id);
  if (search)     results = results.filter(d => JSON.stringify(d).toLowerCase().includes(search.toLowerCase()));
  res.json({ count: results.length, deals: results });
});

// ── GET /crm/deals/:deal_id ───────────────────────────────────────────────────
router.get('/deals/:deal_id', (req, res) => {
  const deal = store.deals.find(d => d.deal_id === req.params.deal_id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
});

// ── POST /crm/deals ───────────────────────────────────────────────────────────
router.post('/deals', (req, res) => {
  const body = req.body;
  if (!body.account_name || !body.dept_id || !body.arr_value) {
    return res.status(400).json({ error: 'account_name, dept_id and arr_value are required' });
  }
  const deal = {
    deal_id:          body.deal_id || store.nextDealId(),
    account_name:     body.account_name,
    account_region:   body.account_region || '',
    dept_id:          body.dept_id,
    owner:            body.owner || '',
    stage:            body.stage || 'Prospecting',
    arr_value:        Number(body.arr_value),
    scheduled_close:  body.scheduled_close || null,
    actual_close:     body.actual_close || null,
    slip_reason:      body.slip_reason || null,
    slip_date:        body.slip_date || null,
    rescheduled_close:body.rescheduled_close || null,
    probability:      Number(body.probability) || 50,
    account_id:       body.account_id || 'REV-001',
    period_impacted:  body.period_impacted || null,
    period_recovered: body.period_recovered || null,
    status:           body.status || 'open',
    classification:   body.classification || 'on_track',
  };
  store.deals = [...store.deals, deal];
  res.status(201).json(deal);
});

// ── PUT /crm/deals/:deal_id ───────────────────────────────────────────────────
router.put('/deals/:deal_id', (req, res) => {
  const idx = store.deals.findIndex(d => d.deal_id === req.params.deal_id);
  if (idx === -1) return res.status(404).json({ error: 'Deal not found' });
  const updated = { ...store.deals[idx], ...req.body, deal_id: req.params.deal_id };
  const arr = [...store.deals];
  arr[idx] = updated;
  store.deals = arr;
  res.json(updated);
});

// ── DELETE /crm/deals/:deal_id ────────────────────────────────────────────────
router.delete('/deals/:deal_id', (req, res) => {
  const before = store.deals.length;
  store.deals = store.deals.filter(d => d.deal_id !== req.params.deal_id);
  if (store.deals.length === before) return res.status(404).json({ error: 'Deal not found' });
  res.json({ deleted: req.params.deal_id });
});

// ── GET /crm/pipeline-summary ─────────────────────────────────────────────────
router.get('/pipeline-summary', (req, res) => {
  const { dept_id, period } = req.query;
  if (!dept_id || !period) return res.status(400).json({ error: 'dept_id and period are required' });
  const deptData = store.pipelineSummary[dept_id];
  if (!deptData) return res.status(404).json({ error: 'No data for dept', available: Object.keys(store.pipelineSummary) });
  const periodData = deptData[period];
  if (!periodData) return res.status(404).json({ error: 'No data for period', available: Object.keys(deptData) });
  res.json({ dept_id, period, ...periodData });
});

// ── GET /crm/variance-context ─────────────────────────────────────────────────
router.get('/variance-context', (req, res) => {
  const { dept_id, period, account_id } = req.query;
  if (!dept_id || !period) return res.status(400).json({ error: 'dept_id and period are required' });

  let slippedDeals = store.deals.filter(d => d.dept_id === dept_id && d.period_impacted === period && ['slipped','at_risk'].includes(d.status));
  let earlyCloses  = store.deals.filter(d => d.dept_id === dept_id && d.period_impacted === period && d.status === 'early_close');
  if (account_id) { slippedDeals = slippedDeals.filter(d => d.account_id === account_id); }

  const totalSlipped    = slippedDeals.reduce((s,d) => s + d.arr_value, 0);
  const totalEarlyClose = earlyCloses.reduce((s,d)  => s + d.arr_value, 0);
  const deptPipeline    = store.pipelineSummary[dept_id];
  const pipeline        = deptPipeline ? (deptPipeline[period] || null) : null;

  let summary = '';
  if (slippedDeals.length)  summary += `${slippedDeals.length} deal(s) totalling $${(totalSlipped/1000).toFixed(0)}K slipped: ${slippedDeals.map(d=>`${d.account_name} ($${(d.arr_value/1000).toFixed(0)}K)`).join(', ')}. `;
  if (earlyCloses.length)   summary += `${earlyCloses.length} early close(s) totalling $${(totalEarlyClose/1000).toFixed(0)}K. `;
  if (!summary) summary = 'No deal slippage or early closes found for this period and department.';

  res.json({ dept_id, period, account_id: account_id||'all', context_summary: summary.trim(),
    slipped_deals: slippedDeals, early_closes: earlyCloses,
    total_slipped_value: totalSlipped, total_early_close_value: totalEarlyClose,
    pipeline_summary: pipeline, data_source: 'Mock CRM — Workshop Demo' });
});

// ── GET /crm/stats ────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const deals = store.deals;
  const totalPipeline = deals.reduce((s,d) => s + d.arr_value, 0);
  const byStatus = deals.reduce((acc,d) => { acc[d.status]=(acc[d.status]||0)+1; return acc; }, {});
  const byDept   = deals.reduce((acc,d) => { acc[d.dept_id]=(acc[d.dept_id]||0)+d.arr_value; return acc; }, {});
  res.json({ total_deals: deals.length, total_pipeline_value: totalPipeline, by_status: byStatus, by_department: byDept });
});

module.exports = router;
