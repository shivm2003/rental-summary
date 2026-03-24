const pool = require('../config/database');

// GET /api/lender/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const lenderId = req.user.uid;

    // Fetch total products
    const { rows: productRows } = await pool.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as available
       FROM listings 
       WHERE lender_id = $1`,
      [lenderId]
    );

    const totalProducts = parseInt(productRows[0].total) || 0;
    const availableProducts = parseInt(productRows[0].available) || 0;

    // Fetch earnings stats
    const { rows: earningsRows } = await pool.query(
      `SELECT 
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' AND date_trunc('month', start_date) = date_trunc('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as monthly_earnings,
          COALESCE(SUM(CASE WHEN status != 'COMPLETED' AND payment_status = 'PAID' THEN total_amount - platform_fee ELSE 0 END), 0) as pending_payouts
       FROM orders
       WHERE lender_id = $1`,
      [lenderId]
    );

    // Fetch utilization stats
    const { rows: utilRows } = await pool.query(
      `SELECT 
          (SELECT COUNT(*) FROM orders WHERE lender_id = $1 AND status = 'ACTIVE') as rented_units,
          (SELECT COUNT(*) FROM maintenance_logs WHERE lender_id = $1 AND status = 'IN_PROGRESS') as maintenance_units`
      , [lenderId]
    );

    res.json({
      success: true,
      stats: {
        totalEarnings: Number(earningsRows[0].total_earnings).toLocaleString('en-IN'),
        monthlyEarnings: Number(earningsRows[0].monthly_earnings).toLocaleString('en-IN'),
        pendingPayouts: Number(earningsRows[0].pending_payouts).toLocaleString('en-IN'),
        totalProducts: totalProducts,
        availableProducts: availableProducts,
        utilizationRate: totalProducts > 0 ? Math.round((parseInt(utilRows[0].rented_units) / totalProducts) * 100) : 0,
        rentedUnits: parseInt(utilRows[0].rented_units),
        maintenanceUnits: parseInt(utilRows[0].maintenance_units)
      },
      topAssets: [],
      recentActivity: []
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/lender/dashboard/products
exports.getProducts = async (req, res, next) => {
  try {
    const lenderId = req.user.uid;
    
    const { rows } = await pool.query(
      `SELECT l.id, l.item_name, l.category, l.rental_price_per_day, l.status, l.created_at,
        COALESCE(
          (SELECT full_url FROM listing_photos WHERE listing_id = l.id ORDER BY display_order ASC LIMIT 1),
          ''
        ) as image
       FROM listings l
       WHERE l.lender_id = $1
       ORDER BY l.created_at DESC`,
      [lenderId]
    );

    // Map DB rows to the structure expected by the frontend
    const mappedProducts = rows.map(r => ({
      id: r.id,
      name: r.item_name,
      sub: `Added ${new Date(r.created_at).toLocaleDateString()}`,
      cat: r.category,
      price: `₹${r.rental_price_per_day}`,
      status: r.status === 'active' ? 'Available' : r.status,
      img: r.image
    }));

    res.json({ success: true, products: mappedProducts });
  } catch (error) {
    next(error);
  }
};

// GET /api/lender/dashboard/orders
exports.getOrders = async (req, res, next) => {
  try {
    const lenderId = req.user.uid;
    const { rows } = await pool.query(`
      SELECT o.order_id, o.start_date, o.end_date, o.duration_days, o.total_amount, o.status,
             l.item_name,
             up.first_name, up.last_name, ua.city, ua.state,
             COALESCE((SELECT full_url FROM listing_photos WHERE listing_id = l.id ORDER BY display_order ASC LIMIT 1), '') as image
      FROM orders o
      JOIN listings l ON o.product_id = l.id
      JOIN user_profiles up ON o.borrower_id = up.user_id
      LEFT JOIN (
        SELECT user_id, city, state,
               ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY is_default DESC, id ASC) as rn
        FROM user_addresses
      ) ua ON o.borrower_id = ua.user_id AND ua.rn = 1
      WHERE o.lender_id = $1
      ORDER BY o.created_at DESC
    `, [lenderId]);

    const mappedOrders = rows.map(r => {
      // Logic for formatting date strings
      const start = new Date(r.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const end = new Date(r.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      
      let durationStr = `${r.duration_days} Days`;
      if (r.status === 'UPCOMING') durationStr = 'Starts Soon';
      if (r.status === 'OVERDUE') durationStr = 'RETURN OVERDUE';
      if (r.status === 'COMPLETED') durationStr = 'Completed';
      
      return {
        id: r.order_id,
        product: r.item_name,
        img: r.image,
        customer: `${r.first_name} ${r.last_name}`,
        location: `${r.city || 'N/A'}, ${r.state || 'N/A'}`,
        start: start,
        end: end,
        duration: durationStr,
        status: r.status,
        amount: `₹${Number(r.total_amount).toLocaleString('en-IN')}`
      };
    });

    res.json({ success: true, orders: mappedOrders });
  } catch (error) {
    next(error);
  }
};

// GET /api/lender/dashboard/earnings
exports.getEarnings = async (req, res, next) => {
  try {
    const lenderId = req.user.uid;
    
    // Aggregate totals from orders
    const { rows } = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as gross,
        COALESCE(SUM(platform_fee), 0) as commission,
        COALESCE(SUM(CASE WHEN payment_status = 'UNPAID' THEN total_amount - platform_fee ELSE 0 END), 0) as pending
      FROM orders
      WHERE lender_id = $1 AND status != 'CANCELLED'
    `, [lenderId]);

    const gross = Number(rows[0].gross);
    const commission = Number(rows[0].commission);
    const pending = Number(rows[0].pending);
    const total = gross - commission;

    res.json({ 
      success: true, 
      earnings: {
        total: total.toLocaleString('en-IN'),
        pending: pending.toLocaleString('en-IN'),
        gross: gross.toLocaleString('en-IN'),
        commission: commission.toLocaleString('en-IN')
      },
      productPerformance: []
    });
  } catch (error) {
    next(error);
  }
};
