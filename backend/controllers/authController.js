/*  backend/controllers/authController.js  */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '587' ? false : true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP Error in Production:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateEmailTemplate = (otp, type = 'account') => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 40px 20px; border-radius: 10px;">
  <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
    <h1 style="color: #2874f0; margin-bottom: 10px; font-size: 28px; font-weight: 800;">EveryThingRental</h1>
    <h2 style="color: #333; margin-bottom: 20px; font-weight: 500;">Verify your ${type}</h2>
    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
      Hello,<br>
      Please use the verification code below to securely sign into your EveryThingRental account. This code will expire in exactly 10 minutes.
    </p>
    <div style="background-color: #f0f7ff; border: 2px dashed #2874f0; border-radius: 8px; padding: 20px; margin: 0 auto; display: inline-block;">
      <span style="font-size: 32px; font-weight: bold; color: #2874f0; letter-spacing: 6px;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 13px; margin-top: 40px;">
      If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.
    </p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
    &copy; ${new Date().getFullYear()} EveryThingRental. All rights reserved.
  </div>
</div>
`;

/* ---------- helpers ---------- */
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('FATAL: JWT_SECRET missing');
  process.exit(1);
}

// Updated token creation to include role
const createToken = (uid, firstName, role) =>
  jwt.sign({ uid, firstName, role }, jwtSecret, { expiresIn: '7d' });

/* ---------- register with role selection ---------- */
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const client = await pool.connect();
  try {
    let { 
      username, 
      email, 
      phone, 
      password, 
      firstName = '', 
      lastName = '',
      desiredRole = 'user' // 'user', 'lender', or 'both'
    } = req.body;
    
    if (!username && email) {
      username = email.split('@')[0];
    }
    
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await client.query('BEGIN');
    
    // Ensure username is unique if auto-generated
    const { rows: uniqueCheck } = await client.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (uniqueCheck.length > 0) {
      username = username + Math.floor(Math.random() * 10000);
    }
    
    const hash = await bcrypt.hash(password, 12);

    // Determine initial role based on selection
    // If they want to be lender, start as 'user' until approved
    const initialRole = desiredRole === 'lender' ? 'user' : desiredRole;
    const isLender = desiredRole === 'lender' || desiredRole === 'both';
    
    // Generate OTP
    // const otp = generateOTP();
    // const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Create user and skip OTP verification for now
    const { rows } = await client.query(
      `INSERT INTO users (username, email, phone, password_hash, password_salt, role, is_verified, account_status)
       VALUES ($1,$2,$3,$4,'',$5,true,'active') RETURNING user_id`,
      [username, email, phone, hash, initialRole]
    );

    /*
    transporter.sendMail({
      from: `"EveryThingRental" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome! Verify your account - EveryThingRental',
      html: generateEmailTemplate(otp, 'account'),
    }).catch(err => console.error('Email send error:', err));
    */
    const uid = rows[0].user_id;

    // Create profile with lender flag
    await client.query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, lender)
       VALUES ($1,$2,$3,$4)`,
      [uid, firstName || username, lastName || '', isLender]
    );

    // If they want to be lender, create application
    if (desiredRole === 'lender') {
      await client.query(
        `INSERT INTO lender_applications (user_id, lender_type, status, trade_name) 
         VALUES ($1, $2, $3, $4)`,
        [uid, 'individual', 'pending', username]
      );
    }

    await client.query('COMMIT');

    // Generate token for direct login
    const token = createToken(uid, firstName || username, initialRole);

    res.status(201).json({ 
      token,
      user: {
        id: uid,
        username,
        email,
        firstName: firstName || username,
        lastName: lastName,
        role: initialRole,
        lender: isLender
      },
      message: desiredRole === 'lender' ? 'Registration successful. Lender pending approval.' : 'Registration successful'
    });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
};

/* ---------- whoami with role ---------- */
exports.me = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.role,
              p.first_name, p.last_name, p.lender 
       FROM users u
       JOIN user_profiles p ON p.user_id = u.user_id 
       WHERE u.user_id = $1`,
      [req.user.uid]
    );
    console.log('🔍 Me query result:', rows);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = rows[0];
    
    // Check if lender application approved but role not updated
    if (user.role === 'user' && user.lender === true) {
      const { rows: app } = await pool.query(
        'SELECT status FROM lender_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user.user_id]
      );
      
      if (app.length > 0 && app[0].status === 'approved') {
        // Update to both
        await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', ['both', user.user_id]);
        user.role = 'both';
      }
    }
    
    res.json({
      id: user.user_id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      lender: user.lender
    });
  } catch (e) {
    next(e);
  }
};

/* ---------- verify OTP ---------- */
exports.verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  try {
    const { rows } = await pool.query(
      `SELECT u.user_id, p.first_name, u.role, p.lender, u.otp_code, u.otp_expires_at 
       FROM users u 
       JOIN user_profiles p ON p.user_id = u.user_id 
       WHERE u.email = $1`,
      [email]
    );

    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    
    const user = rows[0];
    if (user.otp_code !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date(user.otp_expires_at) < new Date()) return res.status(400).json({ message: 'OTP expired. Please try registering/logging in again.' });

    // Mark as verified
    await pool.query('UPDATE users SET is_verified = true, otp_code = NULL, otp_expires_at = NULL WHERE user_id = $1', [user.user_id]);

    let userRole = user.role || 'user';
    
    // Check if user should be 'both' (has lender=true and approved application)
    if (userRole === 'user' && user.lender === true) {
      const { rows: app } = await pool.query(
        'SELECT status FROM lender_applications WHERE user_id = $1 AND status = $2',
        [user.user_id, 'approved']
      );
      
      if (app.length > 0) {
        userRole = 'both';
        await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', ['both', user.user_id]);
      }
    }

    const token = createToken(user.user_id, user.first_name, userRole);
    res.json({ 
      token, 
      user: { id: user.user_id, email, first_name: user.first_name, role: userRole, lender: user.lender } 
    });
  } catch (e) {
    next(e);
  }
};

/* ---------- check lender status ---------- */
exports.checkLenderStatus = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    // Get user with role
    const { rows: [user] } = await pool.query(
      'SELECT role FROM users WHERE user_id = $1',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If already has lender privileges
    if (['lender', 'both', 'admin'].includes(user.role)) {
      return res.json({
        canList: true,
        role: user.role,
        status: 'active'
      });
    }
    
    // Check profile and application
    const { rows: [profile] } = await pool.query(
      'SELECT lender FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    const { rows: applications } = await pool.query(
      'SELECT status FROM lender_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    const appStatus = applications[0]?.status;
    
    // If approved but role not updated yet
    if (profile?.lender === true && appStatus === 'approved') {
      // Auto-upgrade to both
      await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', ['both', userId]);
      return res.json({
        canList: true,
        role: 'both',
        status: 'upgraded_to_both'
      });
    }
    
    res.json({
      canList: false,
      role: user.role,
      lenderProfileFlag: profile?.lender || false,
      applicationStatus: appStatus || 'not_submitted',
      canApply: !applications.length || applications[0].status === 'rejected'
    });
    
  } catch (e) {
    next(e);
  }
};

/* ---------- logout ---------- */
exports.logout = (_req, res) => {
  res.clearCookie('connect.sid');
  res.json({ message: 'Logged out' });
};

/* ---------- login with role detection ---------- */
exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password required' });
    }

    // Ensure role & OTP columns exist (migration safety)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
          ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='otp_code') THEN
          ALTER TABLE users ADD COLUMN otp_code VARCHAR(10);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='otp_expires_at') THEN
          ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP;
        END IF;
      END $$;
    `).catch((err) => console.log('Migration check failed', err));

    const { rows } = await pool.query(
      `SELECT u.user_id,
              u.username,
              u.email,
              u.password_hash,
              u.role,
              u.is_verified,
              p.lender,
              p.first_name,
              p.last_name
       FROM users u
       JOIN user_profiles p ON p.user_id = u.user_id
       WHERE u.email = $1 OR u.phone = $1`,
      [identifier]
    );
    
    if (rows.length === 0) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    // Passwords match!
    /*
    // OTP logic temporarily bypassed
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE user_id = $3', [otp, otpExpires, rows[0].user_id]);
    
    transporter.sendMail({
      from: `"EveryThingRental" <${process.env.SMTP_USER}>`,
      to: rows[0].email,
      subject: 'Verify your secure login - EveryThingRental',
      html: generateEmailTemplate(otp, 'login'),
    }).catch(err => console.log('OTP Email error:', err));

    return res.json({ requireOtp: true, email: rows[0].email });
    */

    // Direct Login without OTP:
    const userRole = rows[0].role || 'user';
    const token = createToken(rows[0].user_id, rows[0].first_name, userRole);
    return res.json({ 
      token, 
      user: { 
        id: rows[0].user_id, 
        email: rows[0].email, 
        first_name: rows[0].first_name, 
        role: userRole, 
        lender: rows[0].lender 
      } 
    });
  } catch (e) {
    next(e);
  }
};

/* ---------- upgrade to lender (admin only) ---------- */
exports.googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Google token required' });

    // Verify token using google-auth-library
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id.apps.googleusercontent.com',
    }).catch(() => null);

    if (!ticket) {
      return res.status(401).json({ message: 'Invalid or expired Google token' });
    }

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;

    // Ensure role column exists
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
          ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_status') THEN
          ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
        END IF;
      END $$;
    `).catch(() => {});

    // Check if user exists
    const { rows } = await pool.query(
      `SELECT u.user_id, u.username, u.role, p.lender, p.first_name, p.last_name
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.user_id
       WHERE u.email = $1`,
      [email]
    );

    let userRole = 'user';
    let userId;
    let firstName = given_name || 'Google';
    let lastName = family_name || 'User';
    let isLender = false;
    let username = email.split('@')[0];

    if (rows.length > 0) {
      // Existing User
      userId = rows[0].user_id;
      userRole = rows[0].role || 'user';
      firstName = rows[0].first_name || firstName;
      lastName = rows[0].last_name || lastName;
      isLender = rows[0].lender || false;
      username = rows[0].username || username;

      // Role elevation check
      if (userRole === 'user' && isLender) {
        const { rows: app } = await pool.query(
          'SELECT status FROM lender_applications WHERE user_id = $1 AND status = $2',
          [userId, 'approved']
        );
        if (app.length > 0) {
          userRole = 'both';
          await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', ['both', userId]);
        }
      }
    } else {
      // New User
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Generate random hash for DB constraints
        const randomHash = await bcrypt.hash(googleId + Date.now(), 10);
        
        // Ensure username is unique
        const { rows: uniqueCheck } = await client.query('SELECT 1 FROM users WHERE username = $1', [username]);
        if (uniqueCheck.length > 0) {
          username = username + Math.floor(Math.random() * 10000);
        }

        const { rows: newUser } = await client.query(
          `INSERT INTO users (username, email, password_hash, password_salt, role, is_verified, account_status)
           VALUES ($1, $2, $3, '', 'user', true, 'active') RETURNING user_id`,
          [username, email, randomHash]
        );
        userId = newUser[0].user_id;

        await client.query(
          `INSERT INTO user_profiles (user_id, first_name, last_name, lender)
           VALUES ($1, $2, $3, false)`,
          [userId, firstName, lastName]
        );

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const authToken = createToken(userId, firstName, userRole);
    
    res.json({
      user: {
        token: authToken,
        id: userId,
        username,
        first_name: firstName,
        last_name: lastName,
        role: userRole,
        lender: isLender
      },
    });

  } catch (error) {
    next(error);
  }
};

/* ---------- upgrade to lender (admin only) ---------- */
exports.approveLender = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    
    // Update user_profiles.lender = true
    await pool.query(
      'UPDATE user_profiles SET lender = true WHERE user_id = $1',
      [userId]
    );
    
    // Update or insert into lender_applications as approved
    await pool.query(
      `INSERT INTO lender_applications (user_id, lender_type, status, trade_name)
       VALUES ($1, 'individual', 'approved', (SELECT username FROM users WHERE user_id = $1))
       ON CONFLICT (user_id) DO UPDATE SET status = 'approved'`,
      [userId]
    );
    
    // Update users.role to 'both' or 'lender'
    await pool.query(
      "UPDATE users SET role = CASE WHEN role = 'user' THEN 'both' ELSE 'lender' END WHERE user_id = $1",
      [userId]
    );
    
    res.json({ message: 'User approved as lender', userId });
    
  } catch (e) {
    next(e);
  }
};