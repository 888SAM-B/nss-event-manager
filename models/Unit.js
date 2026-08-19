const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
    name: String,
    head: { type: mongoose.Schema.Types.Mixed, ref: 'ProgramOfficer' },
    contact: String,
    mail: String,
    password: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    unitNumber: String,
    unitType: { type: String, enum: ['Funded', 'Self-Financing', 'Self-Financed'], default: 'Funded' },
    createdDate: String,
    bankDetails: {
        zbsca: {
            accountNo: String,
            bankName: String,
            branchName: String,
            ifscCode: String
        },
        vendor: {
            vendorName: String,
            accountNo: String,
            bankName: String,
            branchName: String,
            ifscCode: String
        }
    },
    bankOtp: { type: String, default: "" },
    bankOtpExpiresAt: { type: Date },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }], // BUG-26: typed ObjectId refs instead of raw Array
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Unit', unitSchema);
