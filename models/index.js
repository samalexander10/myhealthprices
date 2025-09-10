const mongoose = require('mongoose');

const medicaidDrugUtilizationSchema = new mongoose.Schema({
  utilizationType: { type: String, required: true },
  state: { type: String, required: true, index: true },
  ndc: { type: String, required: true, index: true },
  labelerCode: { type: String, required: true, index: true },
  productCode: { type: String, required: true },
  packageSize: { type: String, required: true },
  year: { type: Number, required: true, index: true },
  quarter: { type: Number, required: true },
  suppressionUsed: { type: Boolean, default: false },
  productName: { type: String, required: true },
  unitsReimbursed: { type: Number, default: 0 },
  numberOfPrescriptions: { type: Number, default: 0 },
  totalAmountReimbursed: { type: Number, default: 0 },
  medicaidAmountReimbursed: { type: Number, default: 0 },
  nonMedicaidAmountReimbursed: { type: Number, default: 0 },
  pricePerUnit: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

medicaidDrugUtilizationSchema.index({ state: 1, year: -1, quarter: 1 });
medicaidDrugUtilizationSchema.index({ productName: 'text' });
medicaidDrugUtilizationSchema.index({ ndc: 1, state: 1 });
medicaidDrugUtilizationSchema.index({ year: -1 });

const drugProductSchema = new mongoose.Schema({
  ndc: { type: String, required: true, unique: true, index: true },
  labelerCode: { type: String, required: true },
  productCode: { type: String, required: true },
  packageSize: { type: String, required: true },
  productName: { type: String, required: true },
  genericName: { type: String },
  totalStates: { type: Number, default: 0 },
  totalPrescriptions: { type: Number, default: 0 },
  totalReimbursed: { type: Number, default: 0 },
  averagePricePerUnit: { type: Number, default: 0 },
  minPricePerUnit: { type: Number, default: 0 },
  maxPricePerUnit: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

drugProductSchema.index({ productName: 'text' });
drugProductSchema.index({ averagePricePerUnit: -1 });

const stateSummarySchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true, index: true },
  year: { type: Number, required: true },
  quarter: { type: Number, required: true },
  totalDrugs: { type: Number, default: 0 },
  totalPrescriptions: { type: Number, default: 0 },
  totalReimbursed: { type: Number, default: 0 },
  averagePricePerPrescription: { type: Number, default: 0 },
  topDrugs: [{ 
    ndc: String, 
    productName: String, 
    totalReimbursed: Number,
    prescriptions: Number 
  }],
  lastUpdated: { type: Date, default: Date.now }
});

stateSummarySchema.index({ state: 1, year: -1, quarter: 1 });

const enhancedDrugSchema = new mongoose.Schema({
  drug_name: { type: String, required: true },
  ndc: { type: String, required: true },
  nadac_price: { type: Number },
  price: { type: Number },
  source: { type: String, required: true },
  generic_name: { type: String },
  pharmacy_id: { type: String },
  pharmacy: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  last_updated: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  labelerCode: { type: String },
  productCode: { type: String },
  packageSize: { type: String }
});

enhancedDrugSchema.index({ drug_name: 1 });
enhancedDrugSchema.index({ ndc: 1 });
enhancedDrugSchema.index({ state: 1 });
enhancedDrugSchema.index({ source: 1 });
enhancedDrugSchema.index({ price: -1 });

const MedicaidDrugUtilization = mongoose.model('MedicaidDrugUtilization', medicaidDrugUtilizationSchema);
const DrugProduct = mongoose.model('DrugProduct', drugProductSchema);
const StateSummary = mongoose.model('StateSummary', stateSummarySchema);
const Drug = mongoose.model('Drug', enhancedDrugSchema);

module.exports = {
  MedicaidDrugUtilization,
  DrugProduct,
  StateSummary,
  Drug
};
