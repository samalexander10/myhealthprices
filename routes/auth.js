const express = require('express');
const { passport, requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin');
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Login - MyHealthPrices</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }
        .logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        .logo h1 {
          color: #333;
          margin: 0;
          font-size: 1.8rem;
        }
        .logo p {
          color: #666;
          margin: 0.5rem 0 0 0;
          font-size: 0.9rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 500;
        }
        input[type="text"], input[type="password"] {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        input[type="text"]:focus, input[type="password"]:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }
        .btn {
          width: 100%;
          padding: 0.75rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #5a6fd8;
        }
        .google-btn {
          background: #db4437;
          margin-top: 1rem;
        }
        .google-btn:hover {
          background: #c23321;
        }
        .error {
          color: #e74c3c;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #fdf2f2;
          border: 1px solid #fecaca;
          border-radius: 5px;
          font-size: 0.9rem;
        }
        .env-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: ${isProduction ? '#e74c3c' : '#27ae60'};
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="env-badge">${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}</div>
      <div class="login-container">
        <div class="logo">
          <h1>🏥 MyHealthPrices</h1>
          <p>Admin Portal</p>
        </div>
        
        ${req.query.error ? `<div class="error">${req.query.error}</div>` : ''}
        
        ${!isProduction ? `
          <form action="/auth/login" method="post">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
          </form>
        ` : ''}
        
        ${isProduction && process.env.GOOGLE_CLIENT_ID ? `
          <a href="/auth/google" class="btn google-btn" style="display: block; text-decoration: none; text-align: center;">
            Sign in with Google
          </a>
        ` : ''}
        
        ${!isProduction ? `
          <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 5px; font-size: 0.9rem; color: #666;">
            <strong>Development Mode:</strong><br>
            Username: admin<br>
            Password: myhealthprices123@
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `);
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/admin',
  failureRedirect: '/auth/login?error=Invalid credentials',
  failureFlash: false
}));

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', {
  successRedirect: '/admin',
  failureRedirect: '/auth/login?error=Google authentication failed'
}));

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/auth/login');
  });
});

router.get('/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      username: req.user.username,
      email: req.user.email
    } : null
  });
});

module.exports = router;
