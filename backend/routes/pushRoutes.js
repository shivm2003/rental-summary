/* backend/routes/pushRoutes.js */
const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/pushController');
const jwt = require('jsonwebtoken');

// Middleware to check if user is logged in (optional for push)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token, just treat as anonymous
    }
  }
  next();
};

router.post('/subscribe', optionalAuth, subscribe);

module.exports = router;
