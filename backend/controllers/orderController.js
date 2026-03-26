const pool = require('../config/database');

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const borrowerId = req.user.uid;
    const { items, selectedAddressId, paymentMethod, deliveryCharge, couponId, discountAmount } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    await client.query('BEGIN');

    const createdOrders = [];

    for (const item of items) {
      const durationDays = item.rental_days || item.duration_days || item.rentalDays || 1;
      const unitMultiplier = (item.price_unit === 'month') ? (durationDays / 30) : durationDays;
      const baseRental = Number(item.rental_price_per_day || item.price) * unitMultiplier;
      const securityDeposit = Number(item.security_deposit) || 0;
      
      const itemDelivery = (Number(deliveryCharge) || 0) / items.length;
      const itemDiscount = (Number(discountAmount) || 0) / items.length;
      const itemTotalAmount = baseRental + securityDeposit + itemDelivery - itemDiscount;

      const productQuery = await client.query('SELECT lender_id FROM listings WHERE id = $1', [item.id]);
      if (productQuery.rows.length === 0) {
        throw new Error(`Product ${item.id} not found`);
      }
      const lenderId = productQuery.rows[0].lender_id;

      const startDate = item.start_date ? new Date(item.start_date) : new Date();
      const endDate = item.end_date ? new Date(item.end_date) : new Date();
      if (!item.end_date) {
        endDate.setDate(startDate.getDate() + durationDays);
      }

      // Check for booking conflicts
      const conflictCheck = await client.query(`
        SELECT 1 FROM orders 
        WHERE product_id = $1 
          AND status NOT IN ('CANCELLED', 'REJECTED')
          AND (
            (start_date <= $2 AND end_date >= $2) OR
            (start_date <= $3 AND end_date >= $3) OR
            (start_date >= $2 AND end_date <= $3)
          )
      `, [item.id, startDate, endDate]);

      if (conflictCheck.rows.length > 0) {
        throw new Error(`Product "${item.item_name || item.name}" is already booked for the selected dates.`);
      }

      const orderIdStr = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const insertQuery = `
        INSERT INTO orders (
          order_id, product_id, lender_id, borrower_id,
          start_date, end_date, duration_days,
          total_amount, base_rental_amount, security_deposit,
          delivery_charge, platform_fee, status, payment_status,
          coupon_id, discount_amount
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, 0, 'ORDERED', $12,
          $13, $14
        ) RETURNING id, order_id
      `;
      
      const values = [
        orderIdStr, item.id, lenderId, borrowerId,
        startDate, endDate, durationDays,
        itemTotalAmount, baseRental, securityDeposit,
        itemDelivery, paymentMethod === 'cod' ? 'PENDING' : 'PAID',
        couponId || null, itemDiscount
      ];

      const result = await client.query(insertQuery, values);
      createdOrders.push(result.rows[0]);
    }

    if (couponId) {
      await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [couponId]);
    }

    await client.query('COMMIT');

    res.status(201).json({ 
      success: true, 
      message: 'Orders created successfully',
      orders: createdOrders 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  } finally {
    client.release();
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const borrowerId = req.user.uid;

    const { rows } = await pool.query(`
      SELECT o.order_id, o.start_date, o.end_date, o.duration_days, o.total_amount, o.status,
             l.item_name,
             COALESCE((SELECT full_url FROM listing_photos WHERE listing_id = l.id ORDER BY display_order ASC LIMIT 1), '') as image
      FROM orders o
      JOIN listings l ON o.product_id = l.id
      WHERE o.borrower_id = $1
      ORDER BY o.created_at DESC
    `, [borrowerId]);

    const mappedOrders = rows.map(r => ({
      _id: r.order_id,
      id: r.order_id,
      products: [{
        product: {
          name: r.item_name,
          images: [{ url: r.image }]
        },
        quantity: 1,
        rentalPeriod: {
          start: r.start_date,
          end: r.end_date
        }
      }],
      totalAmount: r.total_amount,
      status: r.status,
      createdAt: r.start_date
    }));

    res.json({ success: true, orders: mappedOrders });
    
  } catch (err) {
    console.error('Error fetching borrower orders:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProductBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT start_date, end_date FROM orders 
      WHERE product_id = $1 AND status NOT IN ('CANCELLED', 'REJECTED')
    `, [id]);
    res.json({ success: true, bookings: rows });
  } catch (err) {
    console.error('Error fetching product bookings:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const borrowerId = req.user.uid;

    const { rows } = await pool.query(`
      SELECT 
        o.order_id, o.start_date, o.end_date, o.duration_days, 
        o.total_amount, o.base_rental_amount, o.security_deposit, o.delivery_charge, 
        o.status, o.created_at, o.borrower_id, o.lender_id,
        l.id as product_id, l.item_name, l.description,
        COALESCE((SELECT full_url FROM listing_photos WHERE listing_id = l.id ORDER BY display_order ASC LIMIT 1), '') as image,
        COALESCE(p.first_name, u.username, 'Lender') as lender_name, u.email as lender_email
      FROM orders o
      JOIN listings l ON o.product_id = l.id
      LEFT JOIN users u ON o.lender_id = u.user_id
      LEFT JOIN user_profiles p ON p.user_id = u.user_id
      WHERE o.order_id = $1 AND o.borrower_id = $2
    `, [id, borrowerId]);

    if(rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const o = rows[0];
    const orderData = {
      id: o.order_id,
      status: o.status,
      createdAt: o.created_at,
      totalAmount: o.total_amount,
      baseRental: o.base_rental_amount,
      securityDeposit: o.security_deposit,
      deliveryCharge: o.delivery_charge,
      lender: {
        name: o.lender_name,
        email: o.lender_email
      },
      products: [{
        product: {
          id: o.product_id,
          name: o.item_name,
          description: o.description,
          images: [{ url: o.image }]
        },
        quantity: 1,
        rentalPeriod: {
          start: o.start_date,
          end: o.end_date,
          durationDays: o.duration_days
        }
      }]
    };

    res.json({ success: true, order: orderData });
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
