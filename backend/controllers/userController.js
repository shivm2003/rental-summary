/* backend/controllers/userController.js */
const pool = require('../config/database');

exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.uid;
        const { rows } = await pool.query(
            `SELECT u.user_id, u.username, u.email, u.phone, u.role,
                    p.first_name, p.last_name, p.gender, p.lender, p.profile_picture_url
             FROM users u
             JOIN user_profiles p ON p.user_id = u.user_id
             WHERE u.user_id = $1`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    const userId = req.user.uid;
    const { firstName, lastName, gender, phone, email } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update User Profiles (names, gender)
        await client.query(
            `UPDATE user_profiles 
             SET first_name = COALESCE($1, first_name), 
                 last_name = COALESCE($2, last_name), 
                 gender = COALESCE($3, gender)
             WHERE user_id = $4`,
            [firstName, lastName, gender, userId]
        );

        // Update Users (phone, email - only if requested)
        if (phone || email) {
            await client.query(
                `UPDATE users 
                 SET phone = COALESCE($1, phone), 
                     email = COALESCE($2, email)
                 WHERE user_id = $3`,
                [phone, email, userId]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Email or Phone already exists' });
        }
        next(error);
    } finally {
        client.release();
    }
};

/* ---------- PAN Info ---------- */
exports.getPanInfo = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM user_pan_info WHERE user_id = $1', [req.user.uid]);
        res.json(rows[0] || {});
    } catch (error) { next(error); }
};

exports.updatePanInfo = async (req, res, next) => {
    const { panNumber, fullName } = req.body;
    try {
        await pool.query(
            `INSERT INTO user_pan_info (user_id, pan_number, full_name) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id) DO UPDATE SET pan_number = $2, full_name = $3`,
            [req.user.uid, panNumber, fullName]
        );
        res.json({ success: true, message: 'PAN Info updated' });
    } catch (error) { next(error); }
};

/* ---------- Gift Cards ---------- */
exports.getGiftCards = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM user_gift_cards WHERE user_id = $1', [req.user.uid]);
        res.json(rows);
    } catch (error) { next(error); }
};

exports.addGiftCard = async (req, res, next) => {
    const { cardNumber, pin } = req.body; // In real app, validate balance/logic
    try {
        await pool.query(
            'INSERT INTO user_gift_cards (user_id, card_number, pin, balance) VALUES ($1, $2, $3, $4)',
            [req.user.uid, cardNumber, pin, 500] // Dummy 500 balance for demo
        );
        res.json({ success: true, message: 'Gift card added' });
    } catch (error) { next(error); }
};

/* ---------- Saved UPI ---------- */
exports.getSavedUPI = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM user_saved_upi WHERE user_id = $1', [req.user.uid]);
        res.json(rows);
    } catch (error) { next(error); }
};

exports.addSavedUPI = async (req, res, next) => {
    const { vpa, name } = req.body;
    try {
        await pool.query('INSERT INTO user_saved_upi (user_id, vpa, name) VALUES ($1, $2, $3)', [req.user.uid, vpa, name]);
        res.json({ success: true, message: 'UPI saved' });
    } catch (error) { next(error); }
};

/* ---------- Saved Cards ---------- */
exports.getSavedCards = async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT * FROM user_saved_cards WHERE user_id = $1', [req.user.uid]);
        res.json(rows);
    } catch (error) { next(error); }
};

exports.addSavedCard = async (req, res, next) => {
    const { cardNumber, nameOnCard, expiryMonth, expiryYear, cardType } = req.body;
    try {
        await pool.query(
            'INSERT INTO user_saved_cards (user_id, card_number, name_on_card, expiry_month, expiry_year, card_type) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.uid, cardNumber, nameOnCard, expiryMonth, expiryYear, cardType]
        );
        res.json({ success: true, message: 'Card saved' });
    } catch (error) { next(error); }
};
