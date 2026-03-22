/* backend/middleware/admin.js */

const auth = require('./auth');

const adminOnly = (req, res, next) => {
  auth(req, res, (err) => {
    if (err) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  });
};

module.exports = adminOnly;