const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Mongoose Schema for Student User
 * Stores student profile and hashed credentials securely
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [60, 'Full name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address (e.g., student@college.edu)'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long']
    },
    role: {
      type: String,
      default: 'student',
      enum: ['student', 'admin']
    },
    status: {
      type: String,
      default: 'Active'
    }
  },
  {
    timestamps: true // Automatically creates 'createdAt' and 'updatedAt' fields
  }
);

/**
 * Pre-save middleware to hash password before saving to MongoDB
 * Only hashes the password if it has been modified or is newly created
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Instance method to compare candidate password with stored hash
 * @param {string} candidatePassword - Plain text password from login form
 * @returns {Promise<boolean>} True if match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to return a safe user profile object without sensitive fields (password hash, __v)
 * @returns {object} Safe user profile
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
