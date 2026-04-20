/* backend/controllers/pushController.js */
const webpush = require('web-push');
const pool = require('../config/database');

// Configure web-push with VAPID keys from .env if available
let isPushConfigured = false;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      'mailto:shivam@everythingrental.in',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    isPushConfigured = true;
    console.log('✅ Push notifications configured successfully');
  } catch (err) {
    console.error('❌ Failed to set VAPID details:', err.message);
  }
} else {
  console.warn('⚠️ Push notifications NOT configured: VAPID keys missing in environment');
}

/**
 * Save or update a push subscription for a user
 */
exports.subscribe = async (req, res, next) => {
  const { subscription } = req.body;
  const userId = req.user ? req.user.uid : null;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Invalid subscription object' });
  }

  try {
    // Check if endpoint already exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM push_subscriptions WHERE endpoint = $1',
      [subscription.endpoint]
    );

    if (existing.length > 0) {
      // Update user_id if it changed (e.g. user logged in after subscribing anonymously)
      await pool.query(
        'UPDATE push_subscriptions SET user_id = $1, subscription_data = $2 WHERE endpoint = $3',
        [userId, JSON.stringify(subscription), subscription.endpoint]
      );
    } else {
      // Insert new subscription
      await pool.query(
        'INSERT INTO push_subscriptions (user_id, endpoint, subscription_data) VALUES ($1, $2, $3)',
        [userId, subscription.endpoint, JSON.stringify(subscription)]
      );
    }

    res.status(201).json({ success: true, message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    next(error);
  }
};

/**
 * Send a push notification to a specific user (all their devices)
 */
exports.sendToUser = async (userId, payload) => {
  if (!isPushConfigured) {
    console.warn('Skipping sendToUser: Push NOT configured');
    return [];
  }

  try {
    const { rows: subscriptions } = await pool.query(
      'SELECT subscription_data FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    const results = await Promise.all(
      subscriptions.map(sub => 
        webpush.sendNotification(JSON.parse(sub.subscription_data), JSON.stringify(payload))
          .catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              // Subscription has expired or is no longer valid, delete it
              pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [JSON.parse(sub.subscription_data).endpoint]);
            }
            console.error('Error sending push:', err.message);
          })
      )
    );
    return results;
  } catch (error) {
    console.error('sendToUser push error:', error);
  }
};

/**
 * Send a push notification to ALL subscribers
 */
exports.sendToAll = async (payload) => {
  if (!isPushConfigured) {
    console.warn('Skipping sendToAll: Push NOT configured');
    return [];
  }

  try {
    const { rows: subscriptions } = await pool.query('SELECT subscription_data FROM push_subscriptions');
    
    console.log(`Sending global push to ${subscriptions.length} subscribers...`);

    const results = await Promise.all(
      subscriptions.map(sub => 
        webpush.sendNotification(JSON.parse(sub.subscription_data), JSON.stringify(payload))
          .catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
               // Subscription expired, clean it up
               const endpoint = JSON.parse(sub.subscription_data).endpoint;
               pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
            }
            console.error('Error sending push to endpoint:', err.message);
          })
      )
    );
    return results;
  } catch (error) {
    console.error('sendToAll push error:', error);
  }
};
