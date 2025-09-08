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

    const aggregationPipeline = [
      {
        $addFields: {
          pricePerUnit: {
            $cond: {
              if: { $and: [{ $ifNull: ["$price", false] }, { $gt: ["$price", 0] }] },
              then: "$price",
              else: {
                $cond: {
                  if: { $and: [{ $ifNull: ["$nadac_price", false] }, { $gt: ["$nadac_price", 0] }] },
                  then: "$nadac_price",
                  else: 0
                }
              }
            }
          }
        }
      },
      {
        $match: {
          pricePerUnit: { $gt: 0 }
        }
      },
      {
        $sort: { 
          pricePerUnit: -1,
          drug_name: 1
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: "$drug_name",
          genericName: "$generic_name",
          pricePerUnit: 1,
          ndc: 1
        }
      }
    ];

    console.log('Executing aggregation pipeline for top expensive medications...');
    const topMedications = await Drug.aggregate(aggregationPipeline, { maxTimeMS: 30000 }).exec();

    console.log(`Found ${topMedications.length} top expensive medications by price per unit`);
    res.json(topMedications);

  } catch (error) {
    console.error('Error in top-expensive endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for lowest price medications  
app.get('/api/medications/lowest-price', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 3, 1), 10);

    const aggregationPipeline = [
      {
        $addFields: {
          pricePerUnit: {
            $cond: {
              if: { $and: [{ $ifNull: ["$price", false] }, { $gt: ["$price", 0] }] },
              then: "$price",
              else: {
                $cond: {
                  if: { $and: [{ $ifNull: ["$nadac_price", false] }, { $gt: ["$nadac_price", 0] }] },
                  then: "$nadac_price",
                  else: 0
                }
              }
            }
          }
        }
      },
      {
        $match: {
          pricePerUnit: { $gt: 0 }
        }
      },
      {
        $sort: { 
          pricePerUnit: 1,
          drug_name: 1
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: "$drug_name",
          genericName: "$generic_name",
          pricePerUnit: 1,
          ndc: 1
        }
      }
    ];

    console.log('Executing aggregation pipeline for lowest price medications...');
    const lowestPriceMedications = await Drug.aggregate(aggregationPipeline, { maxTimeMS: 30000 }).exec();

    console.log(`Found ${lowestPriceMedications.length} lowest price medications by price per unit`);
    res.json(lowestPriceMedications);

  } catch (error) {
    console.error('Error in lowest-price endpoint:', error);
    res.status(500).json({ error: error.message });
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
