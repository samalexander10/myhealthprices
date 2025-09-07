require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://samalexander10:masr0eCwFibJPTbF@cluster0.mongodb.net/myhealthprices?retryWrites=true&w=majority', {
  serverSelectionTimeoutMS: 30000,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define Drug schema
const drugSchema = new mongoose.Schema({
  drug_name: String,
  ndc: String,
  nadac_price: Number,
  generic_name: String,
  pharmacy_id: String,
  pharmacy: String,
  city: String,
  state: String,
  zip: String,
  last_updated: Date,
  is_active: { type: Boolean, default: true }
});
const Drug = mongoose.model('Drug', drugSchema);

// Middleware
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// API endpoint to search drugs
app.get('/api/drugs', async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'Drug name is required' });
  }
  try {
    const normalizedName = name.trim().toUpperCase();
    const drugs = await Drug.find({
      drug_name: { $regex: normalizedName, $options: 'i' },
    }).limit(1);
    if (drugs.length === 0) {
      return res.status(404).json({ error: 'No drug data found' });
    }
    res.json(drugs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API endpoint for top expensive medications
app.get('/api/medications/top-expensive', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    if (limit < 1 || limit > 10) {
      return res.status(400).json({ error: 'Limit must be between 1 and 10' });
    }

    // Query the SDUD database for top expensive medications by state
    const topMeds = await Drug.find({
      source: 'SDUD',
      price: { $gt: 0 },
      state: { $exists: true, $ne: '' }
    })
    .sort({ price: -1 }) // Sort by price descending
    .limit(limit)
    .select('drug_name price state')
    .lean(); // Use lean() for better performance

    if (!topMeds || topMeds.length === 0) {
      return res.status(404).json({ error: 'No medications found' });
    }

    const formattedMeds = topMeds.map((med) => ({
      id: med._id.toString(),
      name: med.drug_name,
      price: med.price,
      state: med.state
    }));

    res.json(formattedMeds);
  } catch (error) {
    console.error('Error fetching top expensive medications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
