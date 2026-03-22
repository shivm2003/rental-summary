const express = require('express');
const { register, login, me, logout, googleAuth, verifyOtp } = require('../controllers/authController');
const auth = require('../middleware/auth');   // your JWT/cookie guard
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window`
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 register requests per `window`
  message: { message: 'Too many accounts created from this IP, please try again after an hour' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const registerValidation = [
  body('username').optional().trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone is required').escape(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  body('desiredRole').optional().trim().escape()
];

const loginValidation = [
  body('identifier').trim().notEmpty().withMessage('Identifier is required').escape(),
  body('password').notEmpty().withMessage('Password is required')
];

/* ---------- public routes ---------- */
router.post('/register', registerLimiter, registerValidation, register);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/google', googleAuth);

/* ---------- protected routes ---------- */
router.get('/me',     auth, me);
router.post('/logout',auth, logout);

module.exports = router;