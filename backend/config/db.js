const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas or local MongoDB instance
 * Implements graceful connection handling and environment validation
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('\n⚠️  [MongoDB Warning] MONGODB_URI is not configured in backend/.env!');
    console.warn('   Please copy backend/.env.example to backend/.env and provide your MongoDB Atlas connection string.');
    console.warn('   The server will start, but database operations will return a configuration notice.\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true // Ensure unique indexes (e.g. email uniqueness) are created
    });

    console.log(`✅ [MongoDB Connected] Host: ${conn.connection.host} | Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error] ${error.message}`);
    console.error('   Verify your network connection, IP whitelist (0.0.0.0/0 on Atlas), and database credentials.');
    return false;
  }
};

/**
 * Check if MongoDB connection is active
 * @returns {boolean} True if connected, false otherwise
 */
const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  isDbConnected
};
