const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token from HttpOnly cookie or Authorization Bearer header
 * Attaches authenticated student to req.user
 */
const protect = async (req, res, next) => {
  let token = null;

  // 1. Check for token in HttpOnly Cookie (Primary & Most Secure)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization Header (useful for API testing/tools)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token is provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication session found. Please log in.'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev_fallback_secret_student_portal';

    // Verify token validity and expiration
    const decoded = jwt.verify(token, jwtSecret);

    // Fetch user from database excluding password
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The student account linked to this session no longer exists.'
      });
    }

    // Attach user document to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid session token. Please log in again.'
    });
  }
};

module.exports = {
  protect
};
