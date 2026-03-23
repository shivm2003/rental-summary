const pool = require('../config/database');

exports.getRooms = async (req, res) => {
  try {
    const userId = req.user.uid;
    const query = `
      SELECT cr.*, 
             u.first_name as other_first_name, 
             u.profile_picture_url as other_avatar,
             (CASE WHEN cr.lender_id = $1 THEN 'lender' ELSE 'borrower' END) as my_role,
             l.item_name as product_name,
             (SELECT content FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM chat_messages cm WHERE cm.room_id = cr.id ORDER BY cm.created_at DESC LIMIT 1) as last_message_time,
             (SELECT count(*) FROM chat_messages cm WHERE cm.room_id = cr.id AND cm.sender_id != $1 AND cm.is_read = false) as unread_count
      FROM chat_rooms cr
      JOIN user_profiles u ON (
        CASE WHEN cr.user_id = $1 THEN cr.lender_id ELSE cr.user_id END = u.user_id
      )
      LEFT JOIN listings l ON cr.listing_id = l.id
      WHERE cr.user_id = $1 OR cr.lender_id = $1
      ORDER BY last_message_time DESC NULLS LAST
    `;
    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching chat rooms:', err);
    res.status(500).json({ message: 'Error fetching chat rooms' });
  }
};

exports.getRoomMessages = async (req, res) => {
  try {
    const userId = req.user.uid;
    const roomId = req.params.roomId;

    // Verify access
    const roomCheck = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND (user_id = $2 OR lender_id = $2)',
      [roomId, userId]
    );
    if (roomCheck.rows.length === 0) return res.status(403).json({ message: 'Access denied' });

    // Mark messages as read
    await pool.query(
      'UPDATE chat_messages SET is_read = true WHERE room_id = $1 AND sender_id != $2 AND is_read = false',
      [roomId, userId]
    );

    const { rows } = await pool.query(
      'SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at ASC',
      [roomId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { lenderId, listingId } = req.body;

    if (userId == lenderId) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Check if room exists
    let query = 'SELECT * FROM chat_rooms WHERE user_id = $1 AND lender_id = $2 AND listing_id ' + (listingId ? '= $3' : 'IS NULL');
    const params = listingId ? [userId, lenderId, listingId] : [userId, lenderId];
    
    let result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO chat_rooms (user_id, lender_id, listing_id)
        VALUES ($1, $2, $3) RETURNING *
      `;
      result = await pool.query(insertQuery, [userId, lenderId, listingId || null]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating chat room:', err);
    res.status(500).json({ message: 'Error creating chat room' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.uid;
    const roomId = req.params.roomId;
    const { content } = req.body;

    const roomCheck = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND (user_id = $2 OR lender_id = $2)',
      [roomId, userId]
    );
    
    if (roomCheck.rows.length === 0) return res.status(403).json({ message: 'Access denied' });
    const room = roomCheck.rows[0];

    const insertQuery = `
      INSERT INTO chat_messages (room_id, sender_id, content)
      VALUES ($1, $2, $3) RETURNING *
    `;
    const result = await pool.query(insertQuery, [roomId, userId, content]);
    const newMessage = result.rows[0];

    // Notification
    const recipientId = room.user_id == userId ? room.lender_id : room.user_id;

    // Fetch sender info for notification
    const senderInfo = await pool.query('SELECT first_name FROM user_profiles WHERE user_id = $1', [userId]);
    const senderName = senderInfo.rows[0]?.first_name || 'Someone';

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, reference_id)
       VALUES ($1, 'NEW_MESSAGE', $2, $3, $4)`,
      [recipientId, 'New Message', `${senderName} sent you a message`, roomId]
    );

    // Socket.io emit
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${roomId}`).emit('receive_message', newMessage);
      io.to(`user_${recipientId}`).emit('new_notification', {
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${senderName} sent you a message`,
        reference_id: roomId
      });
    }

    res.json(newMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message' });
  }
};
