const mongoose = require('mongoose');

const nodalOfficerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true }, // Hashed
    district: { type: String, required: true }, // Assigned District
    role: { type: String, default: 'nodal' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NodalOfficer', nodalOfficerSchema);
