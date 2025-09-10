const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { MedicaidDrugUtilization, DrugProduct, StateSummary, Drug } = require('../models');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Admin Dashboard - MyHealthPrices</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .env-badge {
          background: ${isProduction ? '#e74c3c' : '#27ae60'};
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 2rem;
        }
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          overflow: hidden;
        }
        .card-header {
          background: #f8f9fa;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #dee2e6;
        }
        .card-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }
        .card-body {
          padding: 1.5rem;
        }
        .upload-area {
          border: 2px dashed #dee2e6;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          transition: border-color 0.2s;
        }
        .upload-area:hover {
          border-color: #667eea;
        }
        .upload-area.dragover {
          border-color: #667eea;
          background: #f8f9ff;
        }
        .file-input {
          display: none;
        }
        .upload-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        }
        .upload-btn:hover {
          background: #5a6fd8;
        }
        .upload-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .progress-container {
          margin-top: 1rem;
          display: none;
        }
        .progress-bar {
          width: 100%;
          height: 20px;
          background: #f0f0f0;
          border-radius: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #667eea;
          width: 0%;
          transition: width 0.3s;
        }
        .progress-text {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 0.5rem;
        }
        .stat-label {
          color: #666;
          font-size: 0.9rem;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin-right: 0.5rem;
        }
        .btn-secondary:hover {
          background: #5a6268;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-danger:hover {
          background: #c82333;
        }
        .log-container {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 1rem;
          max-height: 300px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 0.9rem;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 MyHealthPrices Admin</h1>
        <div class="user-info">
          <span class="env-badge">${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}</span>
          <span>Welcome, ${req.user.username}</span>
          <form action="/auth/logout" method="post" style="display: inline;">
            <button type="submit" class="btn-secondary">Logout</button>
          </form>
        </div>
      </div>

      <div class="container">
        <div class="stats-grid" id="statsGrid">
          <div class="stat-card">
            <div class="stat-number" id="medicaidCount">-</div>
            <div class="stat-label">Medicaid Records</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="drugCount">-</div>
            <div class="stat-label">Drug Records</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="productCount">-</div>
            <div class="stat-label">Drug Products</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="stateCount">-</div>
            <div class="stat-label">State Summaries</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Data Upload</h2>
          </div>
          <div class="card-body">
            <div class="upload-area" id="uploadArea">
              <p>📁 Drag and drop a CSV file here, or click to select</p>
              <input type="file" id="fileInput" class="file-input" accept=".csv" />
              <button type="button" class="upload-btn" onclick="document.getElementById('fileInput').click()">
                Select CSV File
              </button>
            </div>
            
            <div class="progress-container" id="progressContainer">
              <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
              </div>
              <div class="progress-text" id="progressText">Preparing upload...</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Data Management</h2>
          </div>
          <div class="card-body">
            <button type="button" class="btn-secondary" onclick="refreshStats()">Refresh Statistics</button>
            <button type="button" class="btn-secondary" onclick="refreshCache()">Refresh Drug Cache</button>
            <button type="button" class="btn-danger" onclick="clearData()" style="margin-left: 1rem;">Clear All Data</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Upload Log</h2>
          </div>
          <div class="card-body">
            <div class="log-container" id="logContainer">
              Ready for file upload...
            </div>
          </div>
        </div>
      </div>

      <script>
        loadStats();

        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const logContainer = document.getElementById('logContainer');

        uploadArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
          uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
          e.preventDefault();
          uploadArea.classList.remove('dragover');
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            handleFileUpload(files[0]);
          }
        });

        fileInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
          }
        });

        function handleFileUpload(file) {
          if (!file.name.endsWith('.csv')) {
            alert('Please select a CSV file');
            return;
          }

          const formData = new FormData();
          formData.append('csvFile', file);

          progressContainer.style.display = 'block';
          progressFill.style.width = '0%';
          progressText.textContent = 'Starting upload...';
          logContainer.textContent = 'Starting file upload...\\n';

          fetch('/admin/upload', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              progressFill.style.width = '100%';
              progressText.textContent = 'Upload completed successfully!';
              logContainer.textContent += 'Upload completed successfully!\\n';
              loadStats();
            } else {
              progressText.textContent = 'Upload failed: ' + data.error;
              logContainer.textContent += 'Upload failed: ' + data.error + '\\n';
            }
          })
          .catch(error => {
            progressText.textContent = 'Upload failed: ' + error.message;
            logContainer.textContent += 'Upload failed: ' + error.message + '\\n';
          });
        }

        function loadStats() {
          fetch('/admin/stats')
            .then(response => response.json())
            .then(data => {
              document.getElementById('medicaidCount').textContent = data.medicaidCount.toLocaleString();
              document.getElementById('drugCount').textContent = data.drugCount.toLocaleString();
              document.getElementById('productCount').textContent = data.productCount.toLocaleString();
              document.getElementById('stateCount').textContent = data.stateCount.toLocaleString();
            })
            .catch(error => {
              console.error('Error loading stats:', error);
            });
        }

        function refreshStats() {
          loadStats();
          logContainer.textContent += 'Statistics refreshed\\n';
        }

        function refreshCache() {
          fetch('/api/medications/refresh-cache', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                logContainer.textContent += 'Drug cache refreshed successfully\\n';
              } else {
                logContainer.textContent += 'Cache refresh failed: ' + data.error + '\\n';
              }
            })
            .catch(error => {
              logContainer.textContent += 'Cache refresh failed: ' + error.message + '\\n';
            });
        }

        function clearData() {
          if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            fetch('/admin/clear-data', { method: 'POST' })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  logContainer.textContent += 'All data cleared successfully\\n';
                  loadStats();
                } else {
                  logContainer.textContent += 'Clear data failed: ' + data.error + '\\n';
                }
              })
              .catch(error => {
                logContainer.textContent += 'Clear data failed: ' + error.message + '\\n';
              });
          }
        }
      </script>
    </body>
    </html>
  `);
});

router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [medicaidCount, drugCount, productCount, stateCount] = await Promise.all([
      MedicaidDrugUtilization.countDocuments(),
      Drug.countDocuments(),
      DrugProduct.countDocuments(),
      StateSummary.countDocuments()
    ]);

    res.json({
      medicaidCount,
      drugCount,
      productCount,
      stateCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.post('/upload', requireAuth, requireAdmin, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log(`Processing uploaded file: ${req.file.originalname}`);

    await processMedicaidCSV(filePath);

    fs.unlinkSync(filePath);

    res.json({ 
      success: true, 
      message: 'File uploaded and processed successfully',
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: error.message || 'Upload processing failed' 
    });
  }
});

router.post('/clear-data', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Promise.all([
      MedicaidDrugUtilization.deleteMany({}),
      DrugProduct.deleteMany({}),
      StateSummary.deleteMany({}),
      Drug.deleteMany({ source: { $in: ['MEDICAID_SDUD', 'MEDICAID_SDUD_2024'] } })
    ]);

    res.json({ success: true, message: 'All data cleared successfully' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

async function processMedicaidCSV(filePath) {
  return new Promise((resolve, reject) => {
    const batchSize = 1000;
    let medicaidBatch = [];
    let drugBatch = [];
    let totalImported = 0;
    let processedRows = 0;

    const stream = fs.createReadStream(filePath)
      .pipe(csv());

    stream.on('data', async (row) => {
      stream.pause();
      processedRows++;

      try {
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
            source: 'MEDICAID_SDUD_UPLOAD',
            labelerCode: labelerCode,
            productCode: productCode,
            packageSize: packageSize
          });
        }

        if (medicaidBatch.length >= batchSize) {
          try {
            console.log(`Processing batch: ${medicaidBatch.length} records (${processedRows} rows processed)`);
            
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
      } catch (error) {
        console.error('Error processing row:', error);
        stream.resume();
      }
    })
    .on('end', async () => {
      try {
        if (medicaidBatch.length > 0) {
          console.log(`Importing final batch of ${medicaidBatch.length} records...`);
          await MedicaidDrugUtilization.insertMany(medicaidBatch, { ordered: false });
          await Drug.insertMany(drugBatch, { ordered: false });
          totalImported += medicaidBatch.length;
        }
        
        console.log(`Successfully imported ${totalImported} medicaid drug utilization records from ${processedRows} CSV rows`);
        
        await generateDrugProductSummaries();
        await generateStateSummaries();
        
        resolve({ totalImported, processedRows });
      } catch (error) {
        reject(error);
      }
    })
    .on('error', (err) => {
      console.error('CSV parsing error:', err);
      reject(err);
    });
  });
}

async function generateDrugProductSummaries() {
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
}

async function generateStateSummaries() {
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
}

module.exports = router;
