const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../services/welcomeService');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper to format user payload
const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
  avatar: user.avatar || '',
  storageUsedBytes: user.storageUsedBytes || 0,
  storageLimit: user.storageLimit || 104857600
});

// Register user with firstName, lastName, username/email, password, avatar
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, username: rawUsername, password, avatar } = req.body;

    // Determine clean username and email
    let cleanUsername = (rawUsername || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').trim();
    let normalizedEmail = (email || '').toLowerCase().trim();

    if (!cleanUsername && normalizedEmail) {
      cleanUsername = normalizedEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '');
    }

    if (!normalizedEmail && cleanUsername) {
      normalizedEmail = `${cleanUsername}@broo.email`;
    }

    if (!normalizedEmail || !cleanUsername) {
      return res.status(400).json({ message: 'Please provide a valid username or email address' });
    }

    if (cleanUsername.length < 2) {
      return res.status(400).json({ message: 'Username must be at least 2 characters' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email or username already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: `The email ${normalizedEmail} is already registered.` });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({ message: `The handle @${cleanUsername} is already taken. Please choose another.` });
    }

    const cleanFirstName = (firstName || '').trim();
    const cleanLastName = (lastName || '').trim();
    const fullName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ') || cleanUsername;

    // Create new user
    const user = new User({
      email: normalizedEmail,
      username: cleanUsername,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: fullName,
      avatar: (avatar || '').trim()
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);

    await user.save();

    // Automatically deposit welcome email into user's inbox
    await sendWelcomeEmail(user);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user with email/username and password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const input = (email || '').toLowerCase().trim();

    if (!input || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    // Look up user by email or by username
    let user = await User.findOne({
      $or: [
        { email: input },
        { username: input },
        { email: `${input}@broo.email` }
      ]
    }).select('+passwordHash');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email/username or password' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'Invalid credentials. Please set or reset your password.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};