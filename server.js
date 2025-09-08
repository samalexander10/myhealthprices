require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

// Connect to MongoDB Atlas
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI, {
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
  price: Number,
  source: String,
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
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 3, 1), 10);

    const pipeline = [
      {
        $match: {
          nadac_price: { $gt: 0 },
          is_active: true
        }
      },
      { $sort: { nadac_price: -1 } },
      {
        $group: {
          _id: '$drug_name',
          doc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $limit: limit },
      {
        $project: {
          id: '$_id',
          name: '$drug_name',
          price: '$nadac_price',
          ndc: 1,
          last_updated: 1
        }
      }
    ];

    const results = await Drug.aggregate(pipeline).exec();

    if (!results || results.length === 0) {
      return res.json([]);
    }

    const formattedMeds = results.map((med) => ({
      id: med.id.toString(),
      name: med.name,
      price: med.price,
      state: med.state,
      ...(med.last_updated ? { last_updated: med.last_updated } : {})
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
