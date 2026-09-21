/**
 * Database Migration Script
 * Adds new fields to existing Placement documents
 * Run with: node scripts/migrate-db.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

// Define a simple schema for the migration
const placementSchema = new mongoose.Schema({
  aiSummary: String,
  placementCellFormLink: String,
  companyFormLink: String,
}, { strict: false });

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const placementsCollection = db.collection('placements');

    // Get all placements that don't have the new fields
    const placements = await placementsCollection.find({}).toArray();
    console.log(`Found ${placements.length} placements to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const placement of placements) {
      const needsUpdate = 
        !placement.aiSummary || 
        !placement.placementCellFormLink || 
        !placement.companyFormLink;

      if (needsUpdate) {
        const updateData = {};
        
        if (!placement.aiSummary) {
          updateData.aiSummary = null;
        }
        if (!placement.placementCellFormLink) {
          updateData.placementCellFormLink = null;
        }
        if (!placement.companyFormLink) {
          updateData.companyFormLink = null;
        }

        await placementsCollection.updateOne(
          { _id: placement._id },
          { $set: updateData }
        );
        
        console.log(`Updated placement: ${placement.companyName} (${placement._id})`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`- Updated: ${updatedCount} documents`);
    console.log(`- Skipped: ${skippedCount} documents (already have new fields)`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrate();
