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
    eventCode: String,
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }, // Primary Organizing Unit
    coOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }], // Co-Organizing Units (V2)
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }], // Primary Unit Attendees (or legacy combined)
    
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
        reportFile: String, // PDF URL / relative path
        reportPhotos: Array, // Array of Image URLs / relative paths
        guests: [String], // Guest / Resource person names
        submittedAt: { type: Date, default: Date.now },
        organizingUnits: [String], // Names of units involved
        volunteersParticipated: Number,
        beneficiaries: String
    }
});

module.exports = mongoose.model('Event', eventSchema);
