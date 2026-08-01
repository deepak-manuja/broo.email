const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const passport = require('passport');
const { getAttachmentStoragePath } = require('./utils/storage');
require('dotenv').config();

// Passport configuration
require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const attachmentRoutes = require('./routes/attachments');
const userRoutes = require('./routes/user');

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '25mb' })); // For parsing application/json
app.use(express.urlencoded({ extended: true, limit: '25mb' })); // For parsing application/x-www-form-urlencoded
app.use(morgan('combined')); // Logging
app.use(passport.initialize());

// Serve uploaded attachments statically
app.use('/uploads', express.static(getAttachmentStoragePath()));

// Rate limiting for sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Apply rate limiting to login and register routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;