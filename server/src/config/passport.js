'use strict';
const passport                = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User                    = require('../models/User');
const { env }                 = require('./env');
const logger                  = require('../utils/logger');

/* Google OAuth is optional. Registering GoogleStrategy with missing
 * credentials throws at import time, so skip it entirely when not
 * configured — the /auth/google routes check env.GOOGLE_OAUTH_ENABLED
 * before ever invoking this strategy. */
if (env.GOOGLE_OAUTH_ENABLED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL:  env.GOOGLE_CALLBACK_URL,
        scope:        ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email returned from Google'), null);

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

          if (user) {
            if (!user.googleId) {
              user.googleId          = profile.id;
              user.isEmailVerified   = true;
              user.profilePicture    = profile.photos?.[0]?.value || user.profilePicture;
              await user.save();
            }
            return done(null, user);
          }

          user = await User.create({
            googleId:        profile.id,
            name:            profile.displayName,
            email,
            isEmailVerified: true,
            profilePicture:  profile.photos?.[0]?.value || '',
          });

          return done(null, user);
        } catch (err) {
          logger.error(`Google OAuth error: ${err.message}`);
          return done(err, null);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth not configured — /auth/google routes disabled');
}

module.exports = passport;
