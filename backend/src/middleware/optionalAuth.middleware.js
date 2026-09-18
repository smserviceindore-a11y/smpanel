const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Optional auth — attaches req.user if token present, otherwise continues */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.status === 'active') {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

module.exports = optionalAuth;
