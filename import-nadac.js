const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Drug } = require('./models');

require('dotenv').config();

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
  process.exit(1);
});


// Read and import NADAC CSV
const importData = async () => {
  try {
    // Clear existing data with timeout handling
    console.log('Clearing existing drug data...');
    await Drug.deleteMany({}).catch(err => {
      console.error('Error clearing drugs:', err);
      throw err;
    });
    console.log('Cleared existing drug data');

    // Read CSV file
    const drugs = [];
    fs.createReadStream(path.join(__dirname, 'nadac-data.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const drugName = row['NDC Description'] || row['NDC_Description'] || row['Drug Name'] || '';
        const ndc = row['NDC'] || row['ndc'] || '';
        const price = parseFloat(row['NADAC_Per_Unit'] || row['NADAC Per Unit'] || 0);
        if (drugName && ndc) {
          drugs.push({
            drug_name: drugName.trim(),
            ndc: ndc.trim(),
            nadac_price: price,
          });
        }
      })
      .on('end', async () => {
        if (drugs.length === 0) {
          console.log('No valid data found in CSV');
          mongoose.connection.close();
          return;
        }
        console.log(`Importing ${drugs.length} drugs...`);
        await Drug.insertMany(drugs, { ordered: false }).catch(err => {
          console.error('Error inserting drugs:', err);
          throw err;
        });
        console.log(`Successfully imported ${drugs.length} drugs`);
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
