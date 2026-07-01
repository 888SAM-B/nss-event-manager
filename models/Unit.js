const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
    name: String,
    head: { type: mongoose.Schema.Types.Mixed, ref: 'ProgramOfficer' },
    contact: String,
    mail: String,
    password: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    unitNumber: String,
    createdDate: String,
    events: { type: Array, default: [] },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Unit', unitSchema);
