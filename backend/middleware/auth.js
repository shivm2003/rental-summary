/* backend/middleware/auth.js */

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // decoded should contain: { uid, firstName, role }
    req.user = {
      uid: decoded.uid,
      firstName: decoded.firstName,
      role: decoded.role || 'user' // fallback to 'user' if missing
    };
    
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};