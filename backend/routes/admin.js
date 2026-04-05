/* backend/routes/admin.js */

const express = require('express');
const router = express.Router();
const adminOnly = require('../middleware/admin');
const pool = require('../config/database');
const { getDashboardStats, getPendingListings, approveListing, getPendingLenders, approveLender } = require('../controllers/adminController');
const { getAllQueries, updateQueryStatus } = require('../controllers/queryController');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', adminOnly, getDashboardStats);

// Product listings moderation
router.get('/listings/pending', adminOnly, getPendingListings);
router.put('/listings/:id/approve', adminOnly, approveListing);

// Lender applications moderation
router.get('/lenders/pending', adminOnly, getPendingLenders);
router.put('/lenders/:id/approve', adminOnly, approveLender);

// Query management
router.get('/queries', adminOnly, getAllQueries);
router.patch('/queries/:id/status', adminOnly, updateQueryStatus);

// Get all users (for user management)
router.get('/users', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }
    
    if (status !== 'all') {
      params.push(status);
      whereClause += ` AND u.account_status = $${params.length}`;
    }
    
    const { rows } = await pool.query(`
      SELECT 
        u.user_id, u.username, u.email, u.phone, u.account_status,
        u.created_at, u.last_login,
        p.first_name, p.last_name, p.lender,
        CASE 
          WHEN u.last_login >= NOW() - INTERVAL '30 days' THEN 'active'
          WHEN u.last_login >= NOW() - INTERVAL '90 days' THEN 'inactive'
          ELSE 'dormant'
        END as activity_status
      FROM users u
      LEFT JOIN user_profiles p ON p.user_id = u.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    const { rows: [countResult] } = await pool.query(`
      SELECT COUNT(*) as total FROM users u ${whereClause}
    `, params);
    
    res.json({
      users: rows,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(parseInt(countResult.total) / limit),
        total: parseInt(countResult.total)
      }
    });
  } catch (e) {
    next(e);
  }
});

// ============================================
// Delivery Charges API (DB-driven, no hardcoding)
// ============================================
router.get('/delivery-charges', async (req, res) => {
  try {
    const amount = parseFloat(req.query.amount) || 0;
    const { rows } = await pool.query(
      `SELECT charge FROM delivery_charges 
       WHERE min_amount <= $1 AND (max_amount IS NULL OR max_amount >= $1)
       ORDER BY min_amount DESC LIMIT 1`,
      [amount]
    );
    const charge = rows.length > 0 ? parseFloat(rows[0].charge) : 0;
    res.json({ success: true, deliveryCharge: charge });
  } catch (err) {
    console.error('Delivery charge error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all delivery charge rules (admin)
router.get('/delivery-charge-rules', adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM delivery_charges ORDER BY min_amount ASC');
    res.json({ success: true, rules: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// Coupons API
// ============================================

// Validate coupon
router.post('/coupons/validate', async (req, res) => {
  try {
    const { code, amount, lenderId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const { rows } = await pool.query(
      `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND active = true`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const coupon = rows[0];

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Check minimum order
    if (amount < (coupon.min_order_amount || 0)) {
      return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.min_order_amount} required` });
    }

    // Check lender-specific coupon
    if (coupon.lender_id && lenderId && coupon.lender_id != lenderId) {
      return res.status(400).json({ success: false, message: 'This coupon is not applicable for this product' });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (amount * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    discount = Math.min(discount, amount);

    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount,
        message: `₹${discount} discount applied!`
      }
    });
  } catch (err) {
    console.error('Coupon validate error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lender: get my coupons
router.get('/coupons/my', async (req, res) => {
  try {
    const userId = req.headers.authorization ? 
      require('jsonwebtoken').verify(
        req.headers.authorization.replace('Bearer ', ''), 
        process.env.JWT_SECRET
      ).uid : null;
    
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { rows } = await pool.query(
      'SELECT * FROM coupons WHERE lender_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, coupons: rows });
  } catch (err) {
    console.error('My coupons error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lender: create coupon
router.post('/coupons', async (req, res) => {
  try {
    const userId = req.headers.authorization ?
      require('jsonwebtoken').verify(
        req.headers.authorization.replace('Bearer ', ''),
        process.env.JWT_SECRET
      ).uid : null;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ success: false, message: 'Code and discount value required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO coupons (lender_id, code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, code.toUpperCase(), discount_type || 'percentage', discount_value, min_order_amount || 0, max_discount, usage_limit || 100, expires_at]
    );

    res.status(201).json({ success: true, coupon: rows[0], message: 'Coupon created!' });
  } catch (err) {
    if (err.constraint === 'coupons_code_key') {
      return res.status(400).json({ success: false, message: 'This coupon code already exists' });
    }
    console.error('Create coupon error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Lender: toggle coupon active status
router.patch('/coupons/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE coupons SET active = NOT active WHERE id = $1 RETURNING *',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, coupon: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;