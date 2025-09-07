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

// API endpoint to get top expensive medications
app.get('/api/medications/top-expensive', async (req, res) => {
  const { limit = 3 } = req.query;
  try {
    const mockTopMeds = [
      {
        id: 'med_001',
        name: 'HUMIRA 40 MG/0.8 ML PREFILLED PEN',
        price: 7456.02,
        pharmacy: 'CVS Pharmacy',
        city: 'New York',
        state: 'NY'
      },
      {
        id: 'med_002', 
        name: 'ENBREL 50 MG/ML PREFILLED SYRINGE',
        price: 6891.45,
        pharmacy: 'Walgreens',
        city: 'Los Angeles',
        state: 'CA'
      },
      {
        id: 'med_003',
        name: 'REMICADE 100 MG VIAL',
        price: 5234.78,
        pharmacy: 'Rite Aid',
        city: 'Chicago',
        state: 'IL'
      }
    ];
    
    res.json(mockTopMeds.slice(0, parseInt(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
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
