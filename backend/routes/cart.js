const express = require('express');
const pool = require('../config/database');
const router = express.Router();

/* ---------- GET /api/cart  (dummy) ---------- */
router.get('/', (_req, res) => res.json({ cart: [], total: 0 }));

module.exports = router;