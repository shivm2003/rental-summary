/* backend/routes/admin.js */

const express = require('express');
const router = express.Router();
const adminOnly = require('../middleware/admin');
const { getDashboardStats } = require('../controllers/adminController');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', adminOnly, getDashboardStats);

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
    
    const { rows } = await require('../config/database').query(`
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
    
    const { rows: [countResult] } = await require('../config/database').query(`
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

module.exports = router;