/*backend/routes/user.js */
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

/* ---------- GET /api/user/profile  (dummy) ---------- */
router.get('/profile', (_req, res) => res.json({ user: 'placeholder' }));

module.exports = router;