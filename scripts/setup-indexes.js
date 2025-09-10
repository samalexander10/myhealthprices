const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
    const db = mongoose.connection.db;

    await db.collection('drugs').createIndex({ drug_name: 1 });
    await db.collection('drugs').createIndex({ ndc: 1 });
    await db.collection('drugs').createIndex({ state: 1 });
    await db.collection('drugs').createIndex({ source: 1 });
    await db.collection('drugs').createIndex({ drug_name: 1, state: 1 });

    await db.collection('admin_logs').createIndex({ at: -1 });
    await db.collection('admin_logs').createIndex({ action: 1 });

    console.log('Indexes created');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
