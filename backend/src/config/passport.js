const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'https://api.broo.email/api/auth/google/callback';

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const googleId = profile.id;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // Check if user exists by googleId or email
          let user = await User.findOne({
            $or: [{ googleId }, { email }]
          });

          if (!user) {
            // Generate unique username from email
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
              passwordHash: null
            });
            await user.save();
          } else if (!user.googleId) {
            // Link Google ID if user registered via email previously
            user.googleId = googleId;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing or set to placeholder in .env');
}

module.exports = passport;
