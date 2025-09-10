const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI env var');
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  const drugs = db.collection('drugs');

  console.log('Creating indexes on drugs collection...');
  await drugs.createIndex({ drug_name: 1 });
  await drugs.createIndex({ ndc: 1 });
  await drugs.createIndex({ state: 1 });
  await drugs.createIndex({ source: 1 });
  await drugs.createIndex({ drug_name: 1, state: 1 });
  await drugs.createIndex({ source: 1, state: 1 });
  try {
    await drugs.createIndex({ drug_name: 'text' });
  } catch (e) {
    console.warn('Text index creation warning:', e.message);
  }

  console.log('Index creation complete');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Index setup failed:', err);
  process.exit(1);
});
