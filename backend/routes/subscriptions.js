const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// @route   POST /api/subscriptions
// @desc    Store email or phone for exclusive deals
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    
    // Ensure at least one input is provided
    if (!email && !phone) {
      return res.status(400).json({ message: 'Please provide either an Email or a Mobile Number' });
    }

    // Auto-create table dynamically to ensure the environment doesn't crash if migrations are skipped
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(err => console.log('Subscription table check failed: ', err));

    // Insert payload
    await pool.query(
      'INSERT INTO subscriptions (email, phone) VALUES ($1, $2)',
      [email || null, phone || null]
    );

    res.status(201).json({ message: 'Successfully subscribed to Exclusive Deals!' });
  } catch (error) {
    console.error('Subscription Error:', error);
    res.status(500).json({ message: 'Server error during subscription' });
  }
});

module.exports = router;
