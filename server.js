require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cron = require('node-cron');
const session = require('express-session');
const { MedicaidDrugUtilization, DrugProduct, StateSummary, Drug } = require('./models');
const { initializeAuth, passport } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const app = express();

// Connect to MongoDB Atlas
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}
async function initializeIndexes() {
  try {
    await MedicaidDrugUtilization.createIndexes();
    await DrugProduct.createIndexes();
    await StateSummary.createIndexes();
    await Drug.createIndexes();
    console.log('All database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
}).then(async () => {
  console.log('Connected to MongoDB Atlas');
  console.log('Skipping index creation due to storage constraints');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});


async function initializeCachedCollections() {
  const db = mongoose.connection.db;
  
  await db.collection('cached_drugs').createIndex({ type: 1 });
  await db.collection('cached_drugs').createIndex({ lastUpdated: 1 });
  await db.collection('cached_drugs').createIndex({ "drugs.ndcPrefix": 1 });
  
  console.log('Cached drugs collection initialized');
}

function getUniqueByNDC(medications, count) {
  const uniqueMeds = [];
  const usedNDCPrefixes = new Set();
  
  for (const med of medications) {
    let ndcPrefix = null;
    if (med.ndc) {
      const cleanNDC = med.ndc.toString().replace(/[-\s]/g, '');
      ndcPrefix = cleanNDC.substring(0, 5);
    }
    
    const fallbackKey = ndcPrefix || `${med.name}_${med.manufacturer || 'unknown'}`.toLowerCase();
    
    if (!usedNDCPrefixes.has(fallbackKey)) {
      usedNDCPrefixes.add(fallbackKey);
      uniqueMeds.push({
        ...med,
        ndcPrefix: ndcPrefix
      });
      
      if (uniqueMeds.length >= count) break;
    }
  }
  
  return uniqueMeds;
}

async function updateDailyDrugCache() {
  try {
    const db = mongoose.connection.db;
    const medicationsCollection = db.collection('drugs');
    const cachedCollection = db.collection('cached_drugs');
    
    console.log('Starting daily drug cache update...');
    
    const basePipeline = [
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
        $project: {
          name: "$drug_name",
          genericName: "$generic_name",
          pricePerUnit: 1,
          ndc: 1,
          manufacturer: 1
        }
      }
    ];
    
    const highestPricedPipeline = [
      ...basePipeline,
      { $match: { pricePerUnit: { $gt: 0 } } },
      { $sort: { pricePerUnit: -1, name: 1 } },
      { $limit: 50 }
    ];
    
    const highestPricedResults = await medicationsCollection.aggregate(highestPricedPipeline).toArray();
    const topExpensive = getUniqueByNDC(highestPricedResults, 3);
    
    const lowestPricedPipeline = [
      ...basePipeline,
      { $match: { pricePerUnit: { $gte: 1.00 } } },
      { $sort: { pricePerUnit: 1, name: 1 } },
      { $limit: 50 }
    ];
    
    const lowestPricedResults = await medicationsCollection.aggregate(lowestPricedPipeline).toArray();
    const topCheapest = getUniqueByNDC(lowestPricedResults, 3);
    
    const minPrice = topCheapest.length > 0 ? Math.min(...topCheapest.map(d => d.pricePerUnit)) : 1;
    const maxPrice = topExpensive.length > 0 ? Math.max(...topExpensive.map(d => d.pricePerUnit)) : 100;
    const midRangeMin = minPrice + (maxPrice - minPrice) * 0.3;
    const midRangeMax = minPrice + (maxPrice - minPrice) * 0.7;
    
    const featuredPipeline = [
      ...basePipeline,
      { 
        $match: { 
          pricePerUnit: { 
            $gte: midRangeMin,
            $lte: midRangeMax
          }
        }
      },
      { $sample: { size: 50 } }
    ];
    
    const featuredResults = await medicationsCollection.aggregate(featuredPipeline).toArray();
    
    const usedNDCs = new Set();
    [...topExpensive, ...topCheapest].forEach(drug => {
      if (drug.ndcPrefix) usedNDCs.add(drug.ndcPrefix);
    });
    
    const availableFeatured = featuredResults.filter(drug => {
      const ndcPrefix = drug.ndc ? drug.ndc.toString().replace(/[-\s]/g, '').substring(0, 5) : null;
      const fallbackKey = ndcPrefix || `${drug.name}_${drug.manufacturer || 'unknown'}`.toLowerCase();
      return !usedNDCs.has(fallbackKey);
    });
    
    const featured = getUniqueByNDC(availableFeatured, 3);
    
    const cacheData = {
      type: 'daily_drugs',
      lastUpdated: new Date(),
      drugs: {
        topExpensive,
        featured,
        topCheapest
      },
      priceRanges: {
        highest: maxPrice,
        lowest: minPrice,
        featuredMin: midRangeMin,
        featuredMax: midRangeMax
      }
    };
    
    await cachedCollection.replaceOne(
      { type: 'daily_drugs' },
      cacheData,
      { upsert: true }
    );
    
    console.log('Daily drug cache updated successfully:', {
      topExpensive: topExpensive.length,
      featured: featured.length,
      topCheapest: topCheapest.length
    });
    
  } catch (error) {
    console.error('Error updating daily drug cache:', error);
    throw error;
  }
}

async function initializeDrugCache() {
  try {
    const db = mongoose.connection.db;
    const cachedCollection = db.collection('cached_drugs');
    
    const existingCache = await cachedCollection.findOne({ type: 'daily_drugs' });
    
    if (!existingCache || 
        (new Date() - new Date(existingCache.lastUpdated)) > 24 * 60 * 60 * 1000) {
      console.log('Cache is stale or missing, updating...');
      await updateDailyDrugCache();
    } else {
      console.log('Using existing drug cache from:', existingCache.lastUpdated);
    }
  } catch (error) {
    console.error('Error initializing drug cache:', error);
  }
}

// Middleware
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

initializeAuth();
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

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
    const db = mongoose.connection.db;
    const cachedCollection = db.collection('cached_drugs');
    
    const cache = await cachedCollection.findOne({ type: 'daily_drugs' });
    
    if (cache && cache.drugs.topExpensive) {
      res.json(cache.drugs.topExpensive);
    } else {
      console.warn('No cached data available, falling back to real-time calculation');
      await updateDailyDrugCache();
      const newCache = await cachedCollection.findOne({ type: 'daily_drugs' });
      res.json(newCache?.drugs?.topExpensive || []);
    }
  } catch (error) {
    console.error('Error in top-expensive endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for lowest price medications  
app.get('/api/medications/lowest-price', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const cachedCollection = db.collection('cached_drugs');
    
    const cache = await cachedCollection.findOne({ type: 'daily_drugs' });
    
    if (cache && cache.drugs.topCheapest) {
      res.json(cache.drugs.topCheapest);
    } else {
      console.warn('No cached lowest price drugs available');
      res.json([]);
    }
  } catch (error) {
    console.error('Error in lowest-price endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for featured medications
app.get('/api/medications/featured', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const cachedCollection = db.collection('cached_drugs');
    
    const cache = await cachedCollection.findOne({ type: 'daily_drugs' });
    
    if (cache && cache.drugs.featured) {
      res.json(cache.drugs.featured);
    } else {
      console.warn('No cached featured drugs available');
      res.json([]);
    }
  } catch (error) {
    console.error('Error in featured endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/medications/cache-status', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const cachedCollection = db.collection('cached_drugs');
    
    const cache = await cachedCollection.findOne({ type: 'daily_drugs' });
    
    res.json({
      hasCache: !!cache,
      lastUpdated: cache?.lastUpdated,
      drugCounts: {
        topExpensive: cache?.drugs?.topExpensive?.length || 0,
        featured: cache?.drugs?.featured?.length || 0,
        topCheapest: cache?.drugs?.topCheapest?.length || 0
      },
      priceRanges: cache?.priceRanges
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/medications/refresh-cache', async (req, res) => {
  try {
    await updateDailyDrugCache();
    res.json({ success: true, message: 'Cache refreshed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for medicaid drug utilization search
app.get('/api/medicaid/drugs', async (req, res) => {
  try {
    const { name, state, year, quarter } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Drug name is required' });
    }

    let query = {
      productName: { $regex: name, $options: 'i' },
      suppressionUsed: false
    };
    
    if (state) {
      query.state = state;
    }
    
    if (year) {
      query.year = parseInt(year);
    }
    
    if (quarter) {
      query.quarter = parseInt(quarter);
    }

    const drugs = await MedicaidDrugUtilization.find(query)
      .sort({ totalAmountReimbursed: -1 })
      .limit(100);

    res.json(drugs);
  } catch (error) {
    console.error('Error searching medicaid drugs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for drug product summaries
app.get('/api/drug-products', async (req, res) => {
  try {
    const { name, limit = 50 } = req.query;
    
    let query = {};
    if (name) {
      query.productName = { $regex: name, $options: 'i' };
    }

    const products = await DrugProduct.find(query)
      .sort({ totalReimbursed: -1 })
      .limit(parseInt(limit));

    res.json(products);
  } catch (error) {
    console.error('Error fetching drug products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for state summaries
app.get('/api/state-summaries', async (req, res) => {
  try {
    const { state, year, quarter } = req.query;
    
    let query = {};
    if (state) {
      query.state = state;
    }
    if (year) {
      query.year = parseInt(year);
    }
    if (quarter) {
      query.quarter = parseInt(quarter);
    }

    const summaries = await StateSummary.find(query)
      .sort({ totalReimbursed: -1 });

    res.json(summaries);
  } catch (error) {
    console.error('Error fetching state summaries:', error);
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

mongoose.connection.once('open', async () => {
  console.log('Skipping cached collections initialization due to storage constraints');
  
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily drug cache update...');
    try {
      await updateDailyDrugCache();
      console.log('Daily drug cache update completed successfully');
    } catch (error) {
      console.error('Daily drug cache update failed:', error);
    }
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
