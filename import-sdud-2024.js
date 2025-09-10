const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 30000,
}).then(async () => {
  const importer = require('./scripts/sdudImporter');
  const total = await importer.startImport(require('path').join(__dirname, 'medicaid-sdud-2024.csv'));
  console.log(`Imported ${total} SDUD records`);
  process.exit(0);
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
