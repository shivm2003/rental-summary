/* backend/controllers/adminController.js */

const pool = require('../config/database');

// Get dashboard statistics
exports.getPendingListings = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, u.username as lender_name 
      FROM listings l 
      JOIN users u ON l.lender_id = u.user_id 
      WHERE l.status = 'pending' 
      ORDER BY l.created_at DESC
    `);
    res.json({ success: true, listings: rows });
  } catch (error) {
    console.error('getPendingListings error:', error);
    next(error);
  }
};

exports.approveListing = async (req, res, next) => {
  const { id } = req.params;
  const { category_id, category } = req.body;
  try {
    let query;
    const values = [];
    if (category_id && category) {
      query = 'UPDATE listings SET status = $1, category_id = $2, category = $3, updated_at = NOW() WHERE id = $4 RETURNING id';
      values.push('active', category_id, category, id);
    } else {
      query = 'UPDATE listings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id';
      values.push('active', id);
    }
    
    const { rows } = await pool.query(query, values);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    res.json({ success: true, message: 'Listing approved successfully' });
  } catch (error) {
    console.error('approveListing error:', error);
    next(error);
  }
};

exports.getPendingLenders = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (u.email) a.*, u.username, u.email, u.phone 
      FROM lender_applications a
      JOIN users u ON a.user_id = u.user_id
      LEFT JOIN user_profiles p ON p.user_id = a.user_id
      WHERE a.status = 'pending'
        AND (p.lender IS NULL OR p.lender = false)
      ORDER BY u.email, a.created_at DESC
    `);
    res.json({ success: true, applications: rows });
  } catch (error) {
    console.error('getPendingLenders error:', error);
    next(error);
  }
};

exports.approveLender = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Update lender_applications to approved
    const { rows: updatedApp } = await client.query(
      "UPDATE lender_applications SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING user_id",
      [id]
    );

    if (!updatedApp.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const userId = updatedApp[0].user_id;

    // 2. Set user as a lender in user_profiles
    await client.query(
      'UPDATE user_profiles SET lender = true WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Lender approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('approveLender error:', error);
    next(error);
  } finally {
    client.release();
  }
};

// Reject a listing with remark
exports.rejectListing = async (req, res, next) => {
  const { id } = req.params;
  const { remark } = req.body;
  if (!remark) return res.status(400).json({ success: false, message: 'Rejection remark is required' });
  try {
    const { rows } = await pool.query(
      `UPDATE listings SET status = 'rejected', rejection_remark = $1, rejected_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING id`,
      [remark, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, message: 'Listing rejected' });
  } catch (error) {
    // If columns don't exist yet, add them and retry
    if (error.message.includes('rejection_remark')) {
      await pool.query(`ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_remark TEXT, ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP`);
      return exports.rejectListing(req, res, next);
    }
    console.error('rejectListing error:', error);
    next(error);
  }
};

// Reject a lender application with remark
exports.rejectLender = async (req, res, next) => {
  const { id } = req.params;
  const { remark } = req.body;
  if (!remark) return res.status(400).json({ success: false, message: 'Rejection remark is required' });
  try {
    const { rows } = await pool.query(
      `UPDATE lender_applications SET status = 'rejected', rejection_remark = $1, rejected_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING id`,
      [remark, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, message: 'Lender application rejected' });
  } catch (error) {
    if (error.message.includes('rejection_remark')) {
      await pool.query(`ALTER TABLE lender_applications ADD COLUMN IF NOT EXISTS rejection_remark TEXT, ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP`);
      return exports.rejectLender(req, res, next);
    }
    console.error('rejectLender error:', error);
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const { rows: [userStats] } = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login >= NOW() - INTERVAL '30 days' THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_this_week
      FROM users 
      WHERE account_status = 'active'
    `);

    const { rows: [lenderStats] } = await pool.query(`
      SELECT COUNT(*) as total_lenders
      FROM user_profiles WHERE lender = 'true'
    `);

    const { rows: [productStats] } = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_this_month
      FROM listings
    `);

    const { rows: cityStats } = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(city), ''), 'Unknown') as city,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM listings
      GROUP BY COALESCE(NULLIF(TRIM(city), ''), 'Unknown')
      ORDER BY total DESC
    `);

    let revenueStats = { total_revenue: 0, total_orders: 0 };
    try {
      const { rows: [rv] } = await pool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(*) as total_orders
        FROM orders WHERE status = 'COMPLETED'
      `);
      revenueStats = rv;
    } catch (_) {}

    const { rows: recentActivity } = await pool.query(`
      SELECT 'user_registered' as action_type, username as item_name, created_at as time, 'Admin' as user_name
      FROM users ORDER BY created_at DESC LIMIT 5
    `);

    res.json({
      users: {
        total: parseInt(userStats.total_users),
        active: parseInt(userStats.active_users),
        newThisWeek: parseInt(userStats.new_users_this_week)
      },
      lenders: { total: parseInt(lenderStats.total_lenders) },
      products: {
        total: parseInt(productStats.total_products),
        active: parseInt(productStats.active_listings),
        newThisMonth: parseInt(productStats.new_this_month)
      },
      cityStats,
      revenue: {
        total: parseFloat(revenueStats.total_revenue) || 0,
        orders: parseInt(revenueStats.total_orders) || 0
      },
      recentActivity: recentActivity.map(a => ({
        id: Math.random().toString(36),
        action: a.action_type === 'user_registered' ? 'New user registered' : a.action_type,
        item: a.item_name,
        time: formatTimeAgo(a.time),
        type: 'add',
        user: a.user_name
      }))
    });
  } catch (e) {
    next(e);
  }
};

// Helper to format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

// Get products by city with optional category filter
exports.getCityProducts = async (req, res, next) => {
  try {
    const { city, category } = req.query;
    let sql = `
      SELECT l.id, l.item_name, l.city, l.status, l.rental_price_per_day, l.price_unit,
             l.category, l.created_at, u.username as lender_name,
             (SELECT full_url FROM listing_photos lp WHERE lp.listing_id = l.id ORDER BY display_order ASC LIMIT 1) as image_url
      FROM listings l
      JOIN users u ON l.lender_id = u.user_id
      WHERE 1=1
    `;
    const args = [];
    if (city && city !== 'all') {
      args.push(city);
      sql += ` AND TRIM(l.city) = $${args.length}`;
    }
    if (category && category !== 'all') {
      args.push(category);
      sql += ` AND l.category = $${args.length}`;
    }
    sql += ` ORDER BY l.created_at DESC`;

    const { rows } = await pool.query(sql, args);

    // Also return distinct cities and categories for filters
    const { rows: cities } = await pool.query(`SELECT DISTINCT TRIM(city) as city FROM listings WHERE city IS NOT NULL AND TRIM(city) != '' ORDER BY city`);
    const { rows: categories } = await pool.query(`SELECT DISTINCT category FROM listings WHERE category IS NOT NULL AND TRIM(category) != '' ORDER BY category`);

    res.json({ success: true, products: rows, cities: cities.map(c => c.city), categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('getCityProducts error:', error);
    next(error);
  }
};