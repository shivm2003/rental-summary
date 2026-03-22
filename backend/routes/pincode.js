/* backend/routes/pincode.js (separate file) */

const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Public pincode lookup - NO auth required
router.get('/:pincode', async (req, res, next) => {
  try {
    const { pincode } = req.params;

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format'
      });
    }

    const { rows } = await pool.query(
      'SELECT pincode, city, state, area FROM pincode_master WHERE pincode = $1',
      [pincode]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pincode not found or service not available in this area'
      });
    }

    res.json({
      success: true,
      pincode: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;