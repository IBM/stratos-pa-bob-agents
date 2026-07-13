'use strict';

const express = require('express');
const router  = express.Router();
const store   = require('../data/erp-data');

// ── GET /erp/purchase-orders ──────────────────────────────────────────────────
router.get('/purchase-orders', (req, res) => {
  const { dept_id, period, account_id, approval_status, search } = req.query;
  let results = [...store.purchaseOrders];
  if (dept_id)         results = results.filter(p => p.dept_id === dept_id);
  if (period)          results = results.filter(p => p.period  === period);
  if (account_id)      results = results.filter(p => p.account_id === account_id);
  if (approval_status) results = results.filter(p => p.approval_status === approval_status);
  if (search)          results = results.filter(p => JSON.stringify(p).toLowerCase().includes(search.toLowerCase()));
  const unbudgeted = results.filter(p => !p.is_budgeted);
  res.json({ count: results.length, unbudgeted_count: unbudgeted.length,
    total_unbudgeted_amount: unbudgeted.reduce((s,p)=>s+p.amount,0), purchase_orders: results });
});

// ── GET /erp/purchase-orders/:po_id ──────────────────────────────────────────
router.get('/purchase-orders/:po_id', (req, res) => {
  const po = store.purchaseOrders.find(p => p.po_id === req.params.po_id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  res.json(po);
});

// ── POST /erp/purchase-orders ─────────────────────────────────────────────────
router.post('/purchase-orders', (req, res) => {
  const body = req.body;
  if (!body.dept_id || !body.vendor || !body.amount) {
    return res.status(400).json({ error: 'dept_id, vendor and amount are required' });
  }
  const po = {
    po_id:           body.po_id || store.nextPoId(),
    dept_id:         body.dept_id,
    vendor:          body.vendor,
    category:        body.category || 'Other',
    account_id:      body.account_id || 'OPEX-003',
    amount:          Number(body.amount),
    po_date:         body.po_date || new Date().toISOString().slice(0,10),
    period:          body.period || null,
    budget_line:     body.budget_line || '',
    is_budgeted:     !!body.is_budgeted,
    approval_status: body.approval_status || 'pending',
    approver:        body.approver || '',
    notes:           body.notes || '',
  };
  store.purchaseOrders = [...store.purchaseOrders, po];
  res.status(201).json(po);
});

// ── PUT /erp/purchase-orders/:po_id ──────────────────────────────────────────
router.put('/purchase-orders/:po_id', (req, res) => {
  const idx = store.purchaseOrders.findIndex(p => p.po_id === req.params.po_id);
  if (idx === -1) return res.status(404).json({ error: 'PO not found' });
  const updated = { ...store.purchaseOrders[idx], ...req.body, po_id: req.params.po_id };
  const arr = [...store.purchaseOrders]; arr[idx] = updated;
  store.purchaseOrders = arr;
  res.json(updated);
});

// ── DELETE /erp/purchase-orders/:po_id ───────────────────────────────────────
router.delete('/purchase-orders/:po_id', (req, res) => {
  const before = store.purchaseOrders.length;
  store.purchaseOrders = store.purchaseOrders.filter(p => p.po_id !== req.params.po_id);
  if (store.purchaseOrders.length === before) return res.status(404).json({ error: 'PO not found' });
  res.json({ deleted: req.params.po_id });
});

// ── GET /erp/headcount-events ─────────────────────────────────────────────────
router.get('/headcount-events', (req, res) => {
  const { dept_id, period, event_type } = req.query;
  let results = [...store.headcountEvents];
  if (dept_id)    results = results.filter(h => h.dept_id === dept_id);
  if (period)     results = results.filter(h => h.period_first_impact === period);
  if (event_type) results = results.filter(h => h.event_type === event_type);
  res.json({ count: results.length,
    total_unbudgeted_monthly_cost: results.filter(h=>!h.budget_included).reduce((s,h)=>s+h.monthly_cost,0),
    headcount_events: results });
});

// ── POST /erp/headcount-events ────────────────────────────────────────────────
router.post('/headcount-events', (req, res) => {
  const body = req.body;
  if (!body.dept_id || !body.role || !body.monthly_cost) {
    return res.status(400).json({ error: 'dept_id, role and monthly_cost are required' });
  }
  const hc = {
    event_id:           body.event_id || store.nextHcId(),
    dept_id:            body.dept_id,
    event_type:         body.event_type || 'new_hire',
    role:               body.role,
    effective_date:     body.effective_date || null,
    monthly_cost:       Number(body.monthly_cost),
    period_first_impact:body.period_first_impact || null,
    budget_included:    !!body.budget_included,
    notes:              body.notes || '',
  };
  store.headcountEvents = [...store.headcountEvents, hc];
  res.status(201).json(hc);
});

// ── PUT /erp/headcount-events/:event_id ──────────────────────────────────────
router.put('/headcount-events/:event_id', (req, res) => {
  const idx = store.headcountEvents.findIndex(h => h.event_id === req.params.event_id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });
  const updated = { ...store.headcountEvents[idx], ...req.body, event_id: req.params.event_id };
  const arr = [...store.headcountEvents]; arr[idx] = updated;
  store.headcountEvents = arr;
  res.json(updated);
});

// ── DELETE /erp/headcount-events/:event_id ────────────────────────────────────
router.delete('/headcount-events/:event_id', (req, res) => {
  const before = store.headcountEvents.length;
  store.headcountEvents = store.headcountEvents.filter(h => h.event_id !== req.params.event_id);
  if (store.headcountEvents.length === before) return res.status(404).json({ error: 'Event not found' });
  res.json({ deleted: req.params.event_id });
});

// ── GET /erp/cost-context ─────────────────────────────────────────────────────
router.get('/cost-context', (req, res) => {
  const { dept_id, period, account_id } = req.query;
  let pos = store.purchaseOrders.filter(p => !p.is_budgeted);
  let hcs = store.headcountEvents.filter(h => !h.budget_included);
  if (dept_id)    { pos = pos.filter(p => p.dept_id === dept_id);             hcs = hcs.filter(h => h.dept_id === dept_id); }
  if (period)     { pos = pos.filter(p => p.period  === period);              hcs = hcs.filter(h => h.period_first_impact === period); }
  if (account_id) { pos = pos.filter(p => p.account_id === account_id); }
  const totalPo = pos.reduce((s,p)=>s+p.amount,0);
  const totalHc = hcs.reduce((s,h)=>s+h.monthly_cost,0);
  let summary = '';
  if (pos.length) summary += `${pos.length} unbudgeted PO(s) totalling $${(totalPo/1000).toFixed(0)}K. `;
  if (hcs.length) summary += `${hcs.length} unbudgeted headcount event(s) adding $${(totalHc/1000).toFixed(0)}K/month. `;
  if (!summary) summary = 'No unbudgeted cost events found.';
  res.json({ dept_id: dept_id||'all', period: period||'all', account_id: account_id||'all', context_summary: summary.trim(),
    total_unplanned_cost: totalPo+totalHc, unbudgeted_purchase_orders: pos,
    unbudgeted_headcount_events: hcs, cost_benchmarks: store.costBenchmarks, data_source: 'Mock ERP — Workshop Demo' });
});

// ── GET /erp/stats ────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const pos = store.purchaseOrders;
  const hcs = store.headcountEvents;
  const totalSpend = pos.reduce((s,p)=>s+p.amount,0);
  const byDept = pos.reduce((acc,p)=>{ acc[p.dept_id]=(acc[p.dept_id]||0)+p.amount; return acc; },{});
  const byStatus = pos.reduce((acc,p)=>{ acc[p.approval_status]=(acc[p.approval_status]||0)+1; return acc; },{});
  res.json({ total_pos: pos.length, total_spend: totalSpend, total_headcount_events: hcs.length,
    unbudgeted_pos: pos.filter(p=>!p.is_budgeted).length,
    total_monthly_headcount_cost: hcs.reduce((s,h)=>s+h.monthly_cost,0),
    by_department: byDept, by_approval_status: byStatus });
});

module.exports = router;
