const mongoose = require('mongoose');

const circularSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetAudience: { 
        type: String, 
        enum: ['all', 'college', 'unit'], 
        default: 'all',
        required: true 
    },
    attachments: [{
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, default: 'file' } // 'pdf', 'image', 'link', 'doc', etc.
    }],
    postedByName: { type: String, default: 'Administrator' },
    postedByRole: { type: String, enum: ['admin', 'nodal'], default: 'admin' },
    postedByDistrict: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Circular', circularSchema);
