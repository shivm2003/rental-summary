const pool = require('../config/database');
const { sendAdminNotification } = require('../utils/notifications');

exports.createQuery = async (req, res) => {
  try {
    const { orderId, productId, subject, message } = req.body;
    const userId = req.user.uid;
    
    if (!orderId || !productId || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { rows } = await pool.query(
      `INSERT INTO queries (order_id, user_id, product_id, subject, message) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderId, userId, productId, subject, message]
    );

    const query = rows[0];

    // Send Admin Notification
    await sendAdminNotification(
      'NEW_QUERY',
      'New Customer Query',
      `Subject: ${subject || 'No Subject'}\nMessage: ${message.substring(0, 100)}...`,
      query.id,
      req.app.get('io')
    );

    res.status(201).json({ success: true, query, message: 'Query submitted successfully. We will get back to you.' });
  } catch (err) {
    console.error('Create query error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: get all queries
exports.getAllQueries = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.*, 
             COALESCE(p.first_name, u.username, 'User') as user_name,
             u.email as user_email,
             l.item_name as product_name
      FROM queries q
      LEFT JOIN users u ON q.user_id::bigint = u.user_id
      LEFT JOIN user_profiles p ON p.user_id = u.user_id
      LEFT JOIN listings l ON q.product_id = l.id
      ORDER BY q.created_at DESC
    `);
    res.json({ success: true, queries: rows });
  } catch (err) {
    console.error('Get all queries error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: update query status
exports.updateQueryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const { rows } = await pool.query(
      'UPDATE queries SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    res.json({ success: true, query: rows[0] });
  } catch (err) {
    console.error('Update query status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
