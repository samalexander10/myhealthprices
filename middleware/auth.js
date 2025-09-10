const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

const DEV_ADMIN = {
  id: 1,
  username: 'admin',
  password: '$2b$10$Ul34CKL6REf1VzfECfPQa.rRZ4V/kBcgyABYNbqXTDboawK56lzki', // bcrypt hash of 'myhealthprices123@'
  email: 'admin@myhealthprices.com'
};

function initializeAuth() {
  passport.use(new LocalStrategy(
    { usernameField: 'username' },
    async (username, password, done) => {
      try {
        if (username === DEV_ADMIN.username) {
          const isValid = await bcrypt.compare(password, DEV_ADMIN.password);
          if (isValid) {
            return done(null, DEV_ADMIN);
          }
        }
        return done(null, false, { message: 'Invalid credentials' });
      } catch (error) {
        return done(error);
      }
    }
  ));

  if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
        
        if (allowedEmails.length > 0 && !allowedEmails.includes(profile.emails[0].value)) {
          return done(null, false, { message: 'Unauthorized email address' });
        }

        const user = {
          id: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
          provider: 'google'
        };
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    if (id === DEV_ADMIN.id) {
      done(null, DEV_ADMIN);
    } else {
      done(null, { id, provider: 'google' });
    }
  });
}

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  res.redirect('/admin/login');
}

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (process.env.NODE_ENV !== 'production' || req.user.provider === 'google') {
    return next();
  }
  
  res.status(403).json({ error: 'Admin access required' });
}

module.exports = {
  initializeAuth,
  requireAuth,
  requireAdmin,
  passport
};
