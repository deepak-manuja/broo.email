const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register user with email/password
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate username from email (part before @)
    let username = email.split('@')[0];

    // Ensure username is unique
    let baseUsername = username;
    let counter = 0;
    while (await User.findOne({ username })) {
      counter++;
      username = `${baseUsername}${counter}`;
    }

    // Create new user
    user = new User({
      email,
      username,
      passwordHash: null // Will be set below
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user with email/password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Google OAuth login
exports.googleAuth = async (req, res) => {
  try {
    const { tokenId } = req.body;

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, email_verified, name, picture, sub: googleId } = payload;

    // Check if email is verified
    if (!email_verified) {
      return res.status(400).json({ message: 'Google email not verified' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;

      // Generate username from email
      let username = email.split('@')[0];
      let baseUsername = username;
      let counter = 0;
      while (await User.findOne({ username })) {
        counter++;
        username = `${baseUsername}${counter}`;
      }

      user = new User({
        email,
        username,
        googleId,
        passwordHash: null // OAuth-only user
      });
    } else if (!user.googleId) {
      // Existing user without Google ID - link Google account
      user.googleId = googleId;
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isNewUser
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// Google OAuth Callback Handler (Passport)
exports.googleCallback = (req, res) => {
  try {
    const token = generateToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // Redirect to frontend auth callback page with token in query params
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google Callback Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
};

// Logout (client-side token removal)
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};