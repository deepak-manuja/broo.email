const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { registerValidator, loginValidator, validate } = require('../middleware/validation');

// Public routes
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

// Google OAuth Redirect Route (GET)
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// Google OAuth Callback Route (GET)
router.get('/google/callback', 
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'https://broo-email.vercel.app'}/login?error=auth_failed`
  }),
  authController.googleCallback
);

// Google OAuth ID Token Verification (POST)
router.post('/google', authController.googleAuth);

router.post('/logout', authController.logout);

module.exports = router;