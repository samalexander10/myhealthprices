require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from dist (Webpack build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint (optional)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});