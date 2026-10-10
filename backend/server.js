const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from backend/.env (or root .env if present)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, isDbConnected } = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas (non-blocking for development convenience)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// ==============================================================
// Middleware Configuration
// ==============================================================

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser (Required to read HttpOnly auth token)
app.use(cookieParser());

// Cross-Origin Resource Sharing (CORS) with Credentials
// Enables cookie sharing if frontend runs on a different port (e.g., Live Server)
const allowedOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${PORT}`;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || origin === allowedOrigin || origin === 'http://127.0.0.1:5500' || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in local dev, configurable for production
      }
    },
    credentials: true // Allow cookies to be sent cross-origin
  })
);

// ==============================================================
// Serve Frontend Static Files
// ==============================================================
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Friendly Route Aliases
app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(frontendPath, 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

// ==============================================================
// API Endpoints
// ==============================================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'EduPortal Authentication Service',
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()) + ' seconds'
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// 404 Handler for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Fallback to index.html for client-side navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ==============================================================
// Centralized Error Handling Middleware
// ==============================================================
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error on server console without exposing sensitive data to client
  console.error(`[Server Error] ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    // Never expose stack traces to client in production
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ==============================================================
// Start Server (only if not imported by test runner)
// ==============================================================
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🎓 EduPortal Server is running successfully!`);
    console.log(`📡 Local Server URL:  http://localhost:${PORT}`);
    console.log(`🔑 Login Page:        http://localhost:${PORT}/`);
    console.log(`📝 Register Page:     http://localhost:${PORT}/register.html`);
    console.log(`📊 Dashboard:         http://localhost:${PORT}/dashboard.html`);
    console.log(`💓 Health API:        http://localhost:${PORT}/api/health`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;
