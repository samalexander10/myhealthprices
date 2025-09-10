const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

function getDrugModel() {
  if (mongoose.models.Drug) return mongoose.model('Drug');
  const schema = new mongoose.Schema({
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
  return mongoose.model('Drug', schema);
}

async function startImport(filePath) {
  return new Promise((resolve, reject) => {
    const Drug = getDrugModel();
    const batchSize = 500;
    let batch = [];
    let totalImported = 0;
    const abs = filePath || path.join(__dirname, '..', 'medicaid-sdud-2024.csv');
    const stream = fs.createReadStream(abs).pipe(csv());

    stream.on('data', (row) => {
      const suppression = (row['Suppression Used'] || row['suppression'] || '').toString().trim().toUpperCase() === 'TRUE';
      const drugName = (row['Product Name'] || row['Drug Name'] || row['drug_name'] || '').toString().trim();
      const ndc = (row['NDC'] || row['ndc'] || '').toString().trim();
      const state = (row['State'] || row['state'] || '').toString().trim();

      let price = 0;
      const totalReimbursed = parseFloat((row['Total Amount Reimbursed'] || row['total_reimbursed'] || '').toString().replace(/[, ]/g, '')) || 0;
      const prescriptions = parseFloat((row['Number of Prescriptions'] || row['prescriptions'] || '').toString().replace(/[, ]/g, '')) || 0;
      if (prescriptions > 0) {
        price = totalReimbursed / prescriptions;
      } else {
        price = parseFloat(row['Price'] || row['price'] || row['nadac_price'] || 0) || 0;
      }

      if (!suppression && drugName && ndc && state) {
        batch.push({
          drug_name: drugName.toUpperCase(),
          ndc,
          price,
          state,
          source: 'SDUD'
        });
      }

      if (batch.length >= batchSize) {
        stream.pause();
        Drug.insertMany(batch, { ordered: false }).then(() => {
          totalImported += batch.length;
          batch = [];
          stream.resume();
        }).catch(() => {
          totalImported += batch.length;
          batch = [];
          stream.resume();
        });
      }
    });

    stream.on('end', () => {
      if (batch.length > 0) {
        Drug.insertMany(batch, { ordered: false }).then(() => {
          totalImported += batch.length;
          resolve(totalImported);
        }).catch(() => {
          totalImported += batch.length;
          resolve(totalImported);
        });
      } else {
        resolve(totalImported);
      }
    });

    stream.on('error', (err) => reject(err));
  });
}

module.exports = { startImport };
