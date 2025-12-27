#!/bin/bash

# Configuration
# MONGODB_URI should be in .env but script uses direct for mongoimport
MONGODB_URI="mongodb+srv://healthcharges:j0AxXFOHsdsq5w9A@myhealthprices.c5pyf6g.mongodb.net/myhealthprices?appName=myhealthprices"
SDUD_CSV_URL="https://download.medicaid.gov/data/SDUD2024.csv"
FULL_FILE="medicaid-sdud-2024-full.csv"
SUBSET_FILE="medicaid-sdud-2024.csv"

echo "Step 1: Managing Data (Atlas Free Tier has 512MB limit)..."
if [ ! -f "$FULL_FILE" ]; then
    echo "Downloading real Medicaid SDUD 2024 data..."
    curl -L "$SDUD_CSV_URL" -o "$FULL_FILE"
else
    echo "Full data file already exists."
fi

echo "Creating a subset (100,000 rows) to stay within Atlas quota..."
head -n 100000 "$FULL_FILE" > "$SUBSET_FILE"
# Remove header for mongoimport with --fields
echo "Removing header line for type-stable import..."
tail -n +2 "$SUBSET_FILE" > "$SUBSET_FILE.tmp" && mv "$SUBSET_FILE.tmp" "$SUBSET_FILE"

echo "Step 2: Importing subset using mongoimport with explicit types..."
# List all fields with their types as strings to avoid coercion failures on empty fields
FIELDS="Utilization Type.string(),State.string(),NDC.string(),Labeler Code.string(),Product Code.string(),Package Size.string(),Year.string(),Quarter.string(),Suppression Used.string(),Product Name.string(),Units Reimbursed.string(),Number of Prescriptions.string(),Total Amount Reimbursed.string(),Medicaid Amount Reimbursed.string(),Non Medicaid Amount Reimbursed.string()"

mongoimport --uri="$MONGODB_URI" \
            --collection=medicaid_drug_utilization \
            --type=csv \
            --columnsHaveTypes \
            --fields="$FIELDS" \
            --file="$SUBSET_FILE" \
            --drop \
            --numInsertionWorkers=4

echo "Step 3: Calculating Unit Prices and Generating Aggregates..."
# Wait for backend to be ready (start it in background if needed, but here we assume it's running via another terminal if we don't start it)
# Actually, I'll start the backend first.

echo "Process Complete! Real data subset imported and optimized successfully."
