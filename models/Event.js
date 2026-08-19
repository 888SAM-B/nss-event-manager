const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    singleDay: Boolean,
    date: String,
    dateFrom: String,
    dateTo: String,
    timeFrom: String,
    timeTo: String,
    venue: String,
    resourcePerson: String,
    level: { type: String, enum: ['National', 'State', 'Regional', 'District', 'University', 'College'], default: 'College' },
    sponsorship: String,
    registeredMeriBharath: String, // 'Yes' or 'No'
    meriBharathUrl: String,
    images: Array,
    brochure: String,
    eventCode: { type: String, unique: true, sparse: true }, // BUG-05: unique constraint to prevent duplicate codes
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }, // Primary Organizing Unit
    coOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }], // Co-Organizing Units (V2)
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }], // Primary Unit Attendees (or legacy combined)
    isExternal: { type: Boolean, default: false },

    // Collaborators list for request flow
    collaborators: [{
        unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
        unitCode: String,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }],
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    report: {
        conductedOnDate: Boolean,
        participantsCount: Number,
        collegesCount: Number,
        outcome: String,
        reportFile: String,          // PDF URL / relative path
        reportPhotos: Array,         // Array of Image URLs / relative paths
        guests: [String],            // Guest / Resource person names
        submittedAt: { type: Date },
        organizingUnits: [String],   // Names of units involved
        volunteersParticipated: Number,
        beneficiariesCount: Number,  // No. of beneficiaries (numeric, used in prefill)
        treesPlanted: Number,        // For 'Tree Plantation' category events
        bloodUnitsCollected: Number, // For 'Blood Donation' category events
        rallyDistance: Number        // For 'Rallies' / 'Cleanliness Rally' category events (km)
    }
}, { timestamps: true }); // BUG-25: added timestamps for createdAt/updatedAt

module.exports = mongoose.model('Event', eventSchema);
