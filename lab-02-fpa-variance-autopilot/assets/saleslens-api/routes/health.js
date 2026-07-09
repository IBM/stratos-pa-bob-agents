'use strict';

const express = require('express');
const router  = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fpa-external-systems-mock',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime())
  });
});

module.exports = router;
