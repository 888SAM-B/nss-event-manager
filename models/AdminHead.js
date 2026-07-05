const mongoose = require('mongoose');

const adminHeadSchema = new mongoose.Schema({
    position: { type: String, required: true },
    photo: { type: String, required: true },
    name: { type: String, required: true },
    designation: { type: String, required: true },
    qualification: { type: String, required: true },
    rowOrder: { type: Number, default: 1 },
    displayOrder: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminHead', adminHeadSchema);
