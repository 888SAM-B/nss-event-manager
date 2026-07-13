const mongoose = require('mongoose');

const periodicalReportSchema = new mongoose.Schema({
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportType: { type: String, enum: ['Monthly', 'Quarterly', 'Halfyearly', 'Annual', 'Custom', 'Other'], required: true },
    month: { type: String, default: '' }, // For monthly reports
    fromDate: { type: String, required: true }, // YYYY-MM-DD
    toDate: { type: String, required: true }, // YYYY-MM-DD
    periodLabel: { type: String, required: true }, // e.g. "April - June 2026"
    poDetails: {
        name: { type: String, default: '' },
        mobile: { type: String, default: '' },
        email: { type: String, default: '' }
    },
    collegeDetails: {
        name: { type: String, default: '' },
        district: { type: String, default: '' }
    },
    activities: {
        blood_donation: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            bloodUnits: { type: Number, default: 0 }
        },
        health_camps: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            beneficiaries: { type: Number, default: 0 }
        },
        anti_drug: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            beneficiaries: { type: Number, default: 0 }
        },
        voter_sir: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            beneficiaries: { type: Number, default: 0 }
        },
        voter_sveep: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            beneficiaries: { type: Number, default: 0 }
        },
        road_safety: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            beneficiaries: { type: Number, default: 0 }
        },
        tree_plantation: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            saplings: { type: Number, default: 0 }
        },
        important_days: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            date: { type: String, default: '' }
        },
        pledge: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 }
        },
        rallies: {
            programmes: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            date: { type: String, default: '' },
            distance: { type: Number, default: 0 }
        },
        hosted_meetings: {
            programmes: { type: Number, default: 0 },
            guestName: { type: String, default: '' },
            volunteers: { type: Number, default: 0 },
            beneficiaries: { type: Number, default: 0 }
        },
        any_other: {
            programmes: { type: Number, default: 0 },
            colleges: { type: Number, default: 0 },
            volunteers: { type: Number, default: 0 },
            beneficiaries: { type: Number, default: 0 },
            remarks: { type: String, default: '' }
        }
    },
    socialMedia: {
        instagram: { type: String, default: '' },
        facebook: { type: String, default: '' },
        youtube: { type: String, default: '' },
        twitter: { type: String, default: '' },
        other: { type: String, default: '' }
    },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PeriodicalReport', periodicalReportSchema);
