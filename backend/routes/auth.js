const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { isDbConnected } = require('../config/db');

const router = express.Router();

/**
 * Helper: Generate JWT Token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {boolean} rememberMe - Whether to extend validity to 7 days
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, email, rememberMe = false) => {
  const secret = process.env.JWT_SECRET || 'dev_fallback_secret_student_portal';
  const expiresIn = rememberMe ? '7d' : (process.env.JWT_EXPIRES_IN || '24h');

  return jwt.sign({ id: userId, email }, secret, { expiresIn });
};

/**
 * Helper: Set HttpOnly Authentication Cookie
 */
const setAuthCookie = (res, token, rememberMe = false) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = rememberMe
    ? 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    : 24 * 60 * 60 * 1000;    // 24 hours in ms

  res.cookie('token', token, {
    httpOnly: true,                                // Prevent client-side JS from accessing token (XSS protection)
    secure: isProduction,                          // Enforce HTTPS in production; allow HTTP in localhost dev
    sameSite: isProduction ? 'strict' : 'lax',     // Mitigate Cross-Site Request Forgery (CSRF)
    maxAge: maxAge,
    path: '/'
  });
};

/**
 * Email validation helper using regex
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

/**
 * Password strength validator helper
 * Requires min 8 characters, at least 1 uppercase or number/special character
 */
const validatePasswordStrength = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z).';
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one number or special character.';
  }
  return null;
};

// ==============================================================
// 1. POST /api/auth/register — Register a new student
// ==============================================================
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Check for missing required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (Name, Email, Password, Confirm Password).'
      });
    }

    // 2. Validate student full name
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be between 2 and 60 characters.'
      });
    }

    // 3. Validate email format
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. student@college.edu).'
      });
    }

    // 4. Validate password strength
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    // 5. Check if password and confirmation match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter your password.'
      });
    }

    // 6. Verify database connectivity
    if (!isDbConnected() && process.env.NODE_ENV !== 'test') {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently not connected. Please configure MONGODB_URI in backend/.env.'
      });
    }

    // 7. Check if student email is already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address is already registered.'
      });
    }

    // 8. Create new student document (password gets hashed via pre-save hook)
    const newUser = new User({
      name: trimmedName,
      email: normalizedEmail,
      password: password
    });

    await newUser.save();

    // 9. Respond with safe sanitized profile (never send password or hash)
    return res.status(201).json({
      success: true,
      message: 'Student account created successfully! You can now log in.',
      user: newUser.toSafeObject()
    });

  } catch (error) {
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }
    next(error);
  }
});

// ==============================================================
// 2. POST /api/auth/login — Authenticate student & issue JWT cookie
// ==============================================================
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Verify database connectivity
    if (!isDbConnected() && process.env.NODE_ENV !== 'test') {
      return res.status(503).json({
        success: false,
        message: 'Database service is currently not connected. Please configure MONGODB_URI in backend/.env.'
      });
    }

    // 3. Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Safe generic message to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 4. Verify password with bcrypt comparison
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 5. Generate secure JWT token
    const token = generateToken(user._id, user.email, Boolean(rememberMe));

    // 6. Set HttpOnly Cookie
    setAuthCookie(res, token, Boolean(rememberMe));

    // 7. Return safe student profile
    return res.status(200).json({
      success: true,
      message: 'Authentication successful! Welcome to EduPortal.',
      user: user.toSafeObject()
    });

  } catch (error) {
    next(error);
  }
});

// ==============================================================
// 3. GET /api/auth/me — Return authenticated student profile
// ==============================================================
router.get('/me', protect, async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Authenticated student profile retrieved.',
    user: req.user.toSafeObject ? req.user.toSafeObject() : req.user
  });
});

// ==============================================================
// 4. POST /api/auth/logout — Invalidate cookie & clear session
// ==============================================================
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

module.exports = router;
