const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const { MedicaidDrugUtilization, Drug } = require('./models');

require('dotenv').config();

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
}).then(() => {
  console.log('Connected to MongoDB Atlas for test import');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function testImportMedicaidData() {
  try {
    console.log('Starting test medicaid data import (first 100 records only)...');
    
    const csvFilePath = './medicaid-sdud-2024.csv';
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    let processedCount = 0;
    const maxRecords = 100;
    const medicaidRecords = [];
    const drugRecords = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          if (processedCount >= maxRecords) {
            return;
          }

          try {
            const utilizationType = row['Utilization Type'] || '';
            const state = row['State'] || '';
            const ndc = row['NDC'] || '';
            const labelerCode = row['Labeler Code'] || '';
            const productCode = row['Product Code'] || '';
            const packageSize = row['Package Size'] || '';
            const year = parseInt(row['Year']) || 2024;
            const quarter = parseInt(row['Quarter']) || 4;
            const suppressionUsed = row['Suppression Used'] === 'true';
            const productName = row['Product Name'] || '';
            const unitsReimbursed = parseFloat(row['Units Reimbursed']) || 0;
            const numberOfPrescriptions = parseInt(row['Number of Prescriptions']) || 0;
            const totalAmountReimbursed = parseFloat(row['Total Amount Reimbursed']) || 0;
            const medicaidAmountReimbursed = parseFloat(row['Medicaid Amount Reimbursed']) || 0;
            const nonMedicaidAmountReimbursed = parseFloat(row['Non Medicaid Amount Reimbursed']) || 0;

            const pricePerUnit = unitsReimbursed > 0 ? totalAmountReimbursed / unitsReimbursed : 0;

            const medicaidRecord = {
              utilizationType,
              state,
              ndc,
              labelerCode,
              productCode,
              packageSize,
              year,
              quarter,
              suppressionUsed,
              productName,
              unitsReimbursed,
              numberOfPrescriptions,
              totalAmountReimbursed,
              medicaidAmountReimbursed,
              nonMedicaidAmountReimbursed,
              pricePerUnit
            };

            const drugRecord = {
              drug_name: productName,
              ndc: ndc,
              price: pricePerUnit,
              source: 'MEDICAID_SDUD_2024',
              state: state,
              is_active: true,
              labelerCode,
              productCode,
              packageSize
            };

            medicaidRecords.push(medicaidRecord);
            drugRecords.push(drugRecord);
            processedCount++;

          } catch (error) {
            console.error('Error processing row:', error);
          }
        })
        .on('end', async () => {
          try {
            console.log(`Inserting ${medicaidRecords.length} test records...`);
            
            if (medicaidRecords.length > 0) {
              await MedicaidDrugUtilization.insertMany(medicaidRecords);
              console.log(`Successfully inserted ${medicaidRecords.length} medicaid records`);
            }

            if (drugRecords.length > 0) {
              await Drug.insertMany(drugRecords);
              console.log(`Successfully inserted ${drugRecords.length} drug records`);
            }

            console.log('Test import completed successfully');
            resolve();
          } catch (error) {
            console.error('Error inserting records:', error);
            reject(error);
          }
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('Error in test import:', error);
    throw error;
  }
}

testImportMedicaidData()
  .then(() => {
    console.log('Test medicaid data import completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test import failed:', error);
    process.exit(1);
  });
