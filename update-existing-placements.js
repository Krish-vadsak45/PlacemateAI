const mongoose = require('mongoose');
require('dotenv').config();

// Simple extraction function
function extractFromSubject(subject) {
  const patterns = [
    /\([^)]+\)\s*(.+)$/,
    /^(.+)\s*-\s*(.+)$/,
    /^(.+)\s+at\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) {
      const parts = match.slice(1);
      const companyPart = parts.find(p => 
        p.includes('Pvt') || p.includes('Ltd') || p.includes('Inc') || 
        p.includes('Technologies') || p.includes('Solutions') || 
        p.includes('Company') || p.includes('Corp')
      );
      
      if (companyPart) {
        const jobRolePart = parts.find(p => p !== companyPart);
        return {
          companyName: companyPart.trim(),
          jobRole: jobRolePart?.trim() || 'Internship'
        };
      }
    }
  }

  const parenMatch = subject.match(/\([^)]+\)\s*(.+)$/);
  if (parenMatch) {
    return {
      companyName: parenMatch[1].trim(),
      jobRole: 'Internship'
    };
  }

  return { companyName: "Unknown", jobRole: "To be determined" };
}

async function updatePlacements() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Placement = mongoose.model('Placement', new mongoose.Schema({}, { strict: false }));
    
    // Find placements with unknown company name
    const placements = await Placement.find({ 
      companyName: "Unknown" 
    });

    console.log(`Found ${placements.length} placements to update`);

    for (const placement of placements) {
      if (placement.emailSubject) {
        const { companyName, jobRole } = extractFromSubject(placement.emailSubject);
        
        await Placement.findByIdAndUpdate(placement._id, {
          companyName,
          jobRole
        });
        
        console.log(`Updated: ${placement.emailSubject} -> ${companyName} (${jobRole})`);
      }
    }

    console.log('Update completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePlacements();
