const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { MedicaidDrugUtilization, DrugProduct, StateSummary, Drug } = require('./models');

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


const importMedicaidData = async () => {
  try {
    console.log('Clearing existing medicaid drug utilization data...');
    await MedicaidDrugUtilization.deleteMany({}).catch(err => {
      console.error('Error clearing medicaid data:', err);
      throw err;
    });
    console.log('Cleared existing medicaid data');

    const batchSize = 1000;
    let medicaidBatch = [];
    let drugBatch = [];
    let totalImported = 0;
    let processedRows = 0;

    const stream = fs.createReadStream(path.join(__dirname, 'medicaid-sdud-2024.csv'))
      .pipe(csv());

    stream.on('data', async (row) => {
      stream.pause();
      processedRows++;

      const utilizationType = row['Utilization Type']?.trim() || '';
      const state = row['State']?.trim() || '';
      const ndc = row['NDC']?.trim() || '';
      const labelerCode = row['Labeler Code']?.trim() || '';
      const productCode = row['Product Code']?.trim() || '';
      const packageSize = row['Package Size']?.trim() || '';
      const year = parseInt(row['Year']) || 2024;
      const quarter = parseInt(row['Quarter']) || 1;
      const suppressionUsed = row['Suppression Used']?.trim().toLowerCase() === 'true';
      const productName = row['Product Name']?.trim() || '';
      const unitsReimbursed = parseFloat(row['Units Reimbursed']) || 0;
      const numberOfPrescriptions = parseFloat(row['Number of Prescriptions']) || 0;
      const totalAmountReimbursed = parseFloat(row['Total Amount Reimbursed']) || 0;
      const medicaidAmountReimbursed = parseFloat(row['Medicaid Amount Reimbursed']) || 0;
      const nonMedicaidAmountReimbursed = parseFloat(row['Non Medicaid Amount Reimbursed']) || 0;
      const pricePerUnit = unitsReimbursed > 0 ? totalAmountReimbursed / unitsReimbursed : 0;

      if (productName && ndc && state && !suppressionUsed) {
        medicaidBatch.push({
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
        });

        drugBatch.push({
          drug_name: productName,
          ndc: ndc,
          price: pricePerUnit,
          state: state,
          source: 'MEDICAID_SDUD',
          labelerCode: labelerCode,
          productCode: productCode,
          packageSize: packageSize
        });
      }

      if (medicaidBatch.length >= batchSize) {
        try {
          console.log(`Processing batch ${Math.ceil(totalImported / batchSize) + 1}: ${medicaidBatch.length} records (${processedRows} rows processed)`);
          
          await MedicaidDrugUtilization.insertMany(medicaidBatch, { ordered: false });
          await Drug.insertMany(drugBatch, { ordered: false });
          
          totalImported += medicaidBatch.length;
          console.log(`Imported ${totalImported} medicaid records so far...`);
          
          medicaidBatch = [];
          drugBatch = [];
          global.gc && global.gc();
        } catch (err) {
          console.error('Error inserting batch:', err);
        }
      }
      
      stream.resume();
    })
    .on('end', async () => {
      if (medicaidBatch.length > 0) {
        try {
          console.log(`Importing final batch of ${medicaidBatch.length} records...`);
          await MedicaidDrugUtilization.insertMany(medicaidBatch, { ordered: false });
          await Drug.insertMany(drugBatch, { ordered: false });
          totalImported += medicaidBatch.length;
        } catch (err) {
          console.error('Error inserting final batch:', err);
        }
      }
      
      console.log(`Successfully imported ${totalImported} medicaid drug utilization records from ${processedRows} CSV rows`);
      
      console.log('Generating drug product summaries...');
      await generateDrugProductSummaries();
      
      console.log('Generating state summaries...');
      await generateStateSummaries();
      
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

const generateDrugProductSummaries = async () => {
  try {
    await DrugProduct.deleteMany({});
    
    const pipeline = [
      {
        $group: {
          _id: '$ndc',
          labelerCode: { $first: '$labelerCode' },
          productCode: { $first: '$productCode' },
          packageSize: { $first: '$packageSize' },
          productName: { $first: '$productName' },
          totalStates: { $addToSet: '$state' },
          totalPrescriptions: { $sum: '$numberOfPrescriptions' },
          totalReimbursed: { $sum: '$totalAmountReimbursed' },
          prices: { $push: '$pricePerUnit' }
        }
      },
      {
        $project: {
          ndc: '$_id',
          labelerCode: 1,
          productCode: 1,
          packageSize: 1,
          productName: 1,
          totalStates: { $size: '$totalStates' },
          totalPrescriptions: 1,
          totalReimbursed: 1,
          averagePricePerUnit: { $avg: '$prices' },
          minPricePerUnit: { $min: '$prices' },
          maxPricePerUnit: { $max: '$prices' }
        }
      }
    ];
    
    const results = await MedicaidDrugUtilization.aggregate(pipeline);
    
    if (results.length > 0) {
      await DrugProduct.insertMany(results, { ordered: false });
      console.log(`Generated ${results.length} drug product summaries`);
    }
  } catch (err) {
    console.error('Error generating drug product summaries:', err);
  }
};

const generateStateSummaries = async () => {
  try {
    await StateSummary.deleteMany({});
    
    const pipeline = [
      {
        $group: {
          _id: { state: '$state', year: '$year', quarter: '$quarter' },
          totalDrugs: { $addToSet: '$ndc' },
          totalPrescriptions: { $sum: '$numberOfPrescriptions' },
          totalReimbursed: { $sum: '$totalAmountReimbursed' },
          drugs: {
            $push: {
              ndc: '$ndc',
              productName: '$productName',
              totalReimbursed: '$totalAmountReimbursed',
              prescriptions: '$numberOfPrescriptions'
            }
          }
        }
      },
      {
        $project: {
          state: '$_id.state',
          year: '$_id.year',
          quarter: '$_id.quarter',
          totalDrugs: { $size: '$totalDrugs' },
          totalPrescriptions: 1,
          totalReimbursed: 1,
          averagePricePerPrescription: {
            $cond: {
              if: { $gt: ['$totalPrescriptions', 0] },
              then: { $divide: ['$totalReimbursed', '$totalPrescriptions'] },
              else: 0
            }
          },
          topDrugs: {
            $slice: [
              {
                $sortArray: {
                  input: '$drugs',
                  sortBy: { totalReimbursed: -1 }
                }
              },
              5
            ]
          }
        }
      }
    ];
    
    const results = await MedicaidDrugUtilization.aggregate(pipeline);
    
    if (results.length > 0) {
      await StateSummary.insertMany(results, { ordered: false });
      console.log(`Generated ${results.length} state summaries`);
    }
  } catch (err) {
    console.error('Error generating state summaries:', err);
  }
};

importMedicaidData();
