const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 30000,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define Drug schema with state
const drugSchema = new mongoose.Schema({
  drug_name: String,
  ndc: String,
  price: Number,
  state: String,
  source: String,
});
const Drug = mongoose.model('Drug', drugSchema);

// Read and import SDUD CSV in batches
const importData = async () => {
  try {
    // Clear existing SDUD data
    console.log('Clearing existing SDUD drug data...');
    await Drug.deleteMany({ source: 'SDUD' }).catch(err => {
      console.error('Error clearing SDUD drugs:', err);
      throw err;
    });
    console.log('Cleared existing SDUD drug data');

    // Batch processing
    const batchSize = 500; // Reduced batch size
    let batch = [];
    let totalImported = 0;

    const stream = fs.createReadStream(path.join(__dirname, 'medicaid-sdud-2024.csv'))
      .pipe(csv());

    stream.on('data', async (row) => {
      stream.pause(); // Pause stream to process batch

      const drugName = row['Product Name']?.trim() || '';
      const ndc = row['NDC']?.trim() || '';
      const totalReimbursed = parseFloat(row['Total Amount Reimbursed']) || 0;
      const prescriptions = parseFloat(row['Number of Prescriptions']) || 0;
      const price = prescriptions > 0 ? totalReimbursed / prescriptions : 0;
      const state = row['State']?.trim() || '';
      const suppression = row['Suppression Used']?.trim() === 'TRUE';

      if (drugName && ndc && state && !suppression) {
        batch.push({
          drug_name: drugName,
          ndc: ndc,
          price: price,
          state: state,
          source: 'SDUD',
        });
      }

      if (batch.length >= batchSize) {
        try {
          console.log(`Importing batch of ${batch.length} drugs...`);
          await Drug.insertMany(batch, { ordered: false });
          totalImported += batch.length;
          console.log(`Imported ${totalImported} drugs so far...`);
          batch = []; // Clear batch
          global.gc && global.gc(); // Trigger garbage collection if enabled
        } catch (err) {
          console.error('Error inserting batch:', err);
        }
        stream.resume(); // Resume stream
      }
    })
    .on('end', async () => {
      // Insert remaining records
      if (batch.length > 0) {
        try {
          console.log(`Importing final batch of ${batch.length} drugs...`);
          await Drug.insertMany(batch, { ordered: false });
          totalImported += batch.length;
        } catch (err) {
          console.error('Error inserting final batch:', err);
        }
      }
      if (totalImported === 0) {
        console.log('No valid data found in SDUD CSV');
      } else {
        console.log(`Successfully imported ${totalImported} SDUD drugs`);
      }
      mongoose.connection.close();
    })
    .on('error', (err) => {
      console.error('CSV parsing error:', err);
      mongoose.connection.close();
    });
  } catch (err) {
    console.error('Import error:', err);
    mongoose.connection.close();
  }
};

importData();
