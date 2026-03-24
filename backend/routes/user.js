/*backend/routes/user.js */
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

/* ---------- GET /api/user/profile  (dummy) ---------- */
router.get('/profile', (_req, res) => res.json({ user: 'placeholder' }));

const auth = require('../middleware/auth');
router.delete('/account', auth, async (req, res) => {
  try {
    const userId = req.user.uid;
    await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

module.exports = router;