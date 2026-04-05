/*backend/routes/user.js */
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

/* ---------- GET /api/user/profile ---------- */
router.get('/profile', auth, userController.getProfile);

/* ---------- PUT /api/user/profile ---------- */
router.put('/profile', auth, userController.updateProfile);

/* ---------- PAN Info ---------- */
router.get('/pan', auth, userController.getPanInfo);
router.put('/pan', auth, userController.updatePanInfo);

/* ---------- Gift Cards ---------- */
router.get('/gift-cards', auth, userController.getGiftCards);
router.post('/gift-cards', auth, userController.addGiftCard);

/* ---------- Saved Payments ---------- */
router.get('/saved-upi', auth, userController.getSavedUPI);
router.post('/saved-upi', auth, userController.addSavedUPI);

router.get('/saved-cards', auth, userController.getSavedCards);
router.post('/saved-cards', auth, userController.addSavedCard);

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