require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://samalexander10:masr0eCwFibJPTbF@myhealthprices.yoafnzw.mongodb.net/myhealthprices?retryWrites=true&w=majority', {
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

    const mockTopMedications = [
      {
        id: 'med_001',
        name: 'Humira (adalimumab)',
        generic_name: 'adalimumab',
        price: 6240.00,
        pharmacy_id: 'pharm_001',
        pharmacy: 'CVS Pharmacy',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        last_updated: new Date('2024-01-15T10:30:00Z')
      },
      {
        id: 'med_002',
        name: 'Enbrel (etanercept)',
        generic_name: 'etanercept',
        price: 5800.50,
        pharmacy_id: 'pharm_002',
        pharmacy: 'Walgreens',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210',
        last_updated: new Date('2024-01-15T09:15:00Z')
      },
      {
        id: 'med_003',
        name: 'Remicade (infliximab)',
        generic_name: 'infliximab',
        price: 5200.25,
        pharmacy_id: 'pharm_003',
        pharmacy: 'Rite Aid',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        last_updated: new Date('2024-01-14T16:45:00Z')
      },
      {
        id: 'med_004',
        name: 'Stelara (ustekinumab)',
        generic_name: 'ustekinumab',
        price: 4800.75,
        pharmacy_id: 'pharm_004',
        pharmacy: 'CVS Pharmacy',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        last_updated: new Date('2024-01-13T14:20:00Z')
      },
      {
        id: 'med_005',
        name: 'Cosentyx (secukinumab)',
        generic_name: 'secukinumab',
        price: 4500.00,
        pharmacy_id: 'pharm_005',
        pharmacy: 'Walgreens',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85001',
        last_updated: new Date('2024-01-12T11:30:00Z')
      }
    ];

    const topMeds = mockTopMedications.slice(0, limit);
    
    if (!topMeds || topMeds.length === 0) {
      return res.status(404).json({ error: 'No medications found' });
    }

    res.json(topMeds);
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
