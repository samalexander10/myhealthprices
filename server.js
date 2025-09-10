require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cron = require('node-cron');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

const AUTH_MODE = process.env.AUTH_MODE || (process.env.NODE_ENV === 'production' ? 'google' : 'basic');
const ALLOWED_EMAILS = (process.env.OAUTH_ALLOWED_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

const authRouter = express.Router();

if (AUTH_MODE === 'google') {
  passport.serializeUser((user, done) => done(null, { email: user.email, name: user.name }));
  passport.deserializeUser((obj, done) => done(null, obj));
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.OAUTH_REDIRECT_URI || ''
  }, (accessToken, refreshToken, profile, done) => {
    const email = (profile.emails && profile.emails[0] && profile.emails[0].value || '').toLowerCase();
    const name = profile.displayName;
    if (!ALLOWED_EMAILS.includes(email)) {
      return done(null, false, { message: 'Unauthorized' });
    }
    return done(null, { email, name });
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  authRouter.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/access-denied' }),
    (req, res) => res.redirect('/admin')
  );
} else {
  authRouter.post('/login', express.json(), (req, res) => {
    const { username, password } = req.body || {};
    const expectedUser = process.env.DEV_ADMIN_USER || 'admin';
    const expectedPass = process.env.DEV_ADMIN_PASS || 'myhealth';
    if (username === expectedUser && password === expectedPass) {
      req.session.authenticated = true;
      req.session.user = { email: 'dev-admin@local', name: 'Dev Admin' };
      return res.json({ authenticated: true, user: req.session.user });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  });
}

authRouter.post('/logout', (req, res) => {
  if (req.logout) req.logout(() => {});
  if (req.session) req.session.destroy(() => {});
  res.json({ success: true });
});
authRouter.get('/me', (req, res) => {
  if (AUTH_MODE === 'google') {
    if (!req.user) return res.status(200).json({ authenticated: false });
    return res.json({ authenticated: true, user: req.user });
  } else {
    if (!req.session || !req.session.authenticated) return res.status(200).json({ authenticated: false });
    return res.json({ authenticated: true, user: req.session.user });
  }
});
app.use('/auth', authRouter);

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



function requireAdmin(req, res, next) {
  if (AUTH_MODE === 'google') {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const allowed = (process.env.OAUTH_ALLOWED_EMAILS || '').toLowerCase();
    const list = allowed.split(',').map(s => s.trim()).filter(Boolean);
    if (!list.includes((req.user.email || '').toLowerCase())) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  } else {
    if (!req.session || !req.session.authenticated) return res.status(401).json({ error: 'Not authenticated' });
    return next();
  }
}

async function logAdminAction(req, action, details) {
  try {
    const db = mongoose.connection.db;
    await db.collection('admin_logs').insertOne({
      action,
      details,
      email: (req.user && req.user.email) || 'unknown',
      at: new Date()
    });
  } catch (e) {}
}
function ensureDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'DB not connected' });
  }
  next();
}

const admin = express.Router();
admin.use(requireAdmin);

admin.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const drugsCount = await db.collection('drugs').countDocuments();
    const cachedCount = await db.collection('cached_drugs').countDocuments();
    const logsCount = await db.collection('admin_logs').countDocuments();
    res.json({ drugsCount, cachedCount, logsCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.get('/logs', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const logs = await db.collection('admin_logs').find({}).sort({ at: -1 }).limit(100).toArray();
    res.json({ logs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.post('/clear', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    await db.collection('drugs').deleteMany({});
    await db.collection('cached_drugs').deleteMany({});
    await logAdminAction(req, 'clear', {});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

admin.post('/import', async (req, res) => {
  try {
    const importer = require('./scripts/sdudImporter');
    importer.startImport(path.join(__dirname, 'medicaid-sdud-2024.csv')).then(async total => {
      await logAdminAction(req, 'import_complete', { total });
    }).catch(async err => {
      await logAdminAction(req, 'import_error', { error: err.message });
    });
    await logAdminAction(req, 'import_started', {});
    res.json({ started: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api/admin', admin);

async function initializeCachedCollections() {
  const db = mongoose.connection.db;
  await db.collection('cached_drugs').createIndex({ type: 1 });
  await db.collection('cached_drugs').createIndex({ lastUpdated: 1 });
  await db.collection('cached_drugs').createIndex({ "drugs.ndcPrefix": 1 });
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

mongoose.connection.once('open', async () => {
  await initializeCachedCollections();
  await initializeDrugCache();
  
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
