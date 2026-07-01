const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
    image: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
