const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    select: false // Do not return passwordHash in queries by default
  },
  googleId: {
    type: String,
    sparse: true // Allows multiple null values, but unique when set
  },
  storageUsedBytes: {
    type: Number,
    default: 0
  },
  storageLimit: {
    type: Number,
    default: 104857600 // 100MB in bytes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to set password (hashes it)
userSchema.methods.setPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

// Method to validate password
userSchema.methods.validatePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Virtual for gravatar (optional)
// userSchema.virtual('gravatar').get(function() {
//   const hash = crypto.createHash('md5').update(this.email).digest('hex');
//   return `https://gravatar.com/avatar/${hash}?d=identicon`;
// });

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);