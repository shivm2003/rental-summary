/* backend/utils/notifications.js */
const pool = require('../config/database');

/**
 * Sends a notification to all users with 'admin' role.
 * 
 * @param {string} type - Notification type (e.g., 'PENDING_LENDER', 'PENDING_LISTING', 'NEW_QUERY')
 * @param {string} title - Short title for the notification
 * @param {string} message - Detailed notification message
 * @param {string|number} referenceId - ID of the related entity (listing ID, application ID, or query ID)
 * @param {object} io - (Optional) Socket.io instance to emit real-time event
 */
async function sendAdminNotification(type, title, message, referenceId, io = null) {
  try {
    // 1. Find all admin users
    const { rows: admins } = await pool.query(
      "SELECT user_id FROM users WHERE role = 'admin'"
    );

    if (admins.length === 0) {
      console.warn('No admin users found to receive notification');
      return;
    }

    // 2. Create notifications for each admin
    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, reference_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;

    const notificationPromises = admins.map(async (admin) => {
      const { rows } = await pool.query(insertQuery, [admin.user_id, type, title, message, referenceId]);
      const newNotif = rows[0];
      
      // If io is provided, emit real-time event
      if (io) {
        io.to(`user_${admin.user_id}`).emit('new_notification', newNotif);
      }
      return newNotif;
    });

    await Promise.all(notificationPromises);
    console.log(`Admin notification [${type}] sent to ${admins.length} admins (Real-time: ${!!io}).`);
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

module.exports = { sendAdminNotification };
