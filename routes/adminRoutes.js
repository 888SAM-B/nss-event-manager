const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
    getAdminStats,
    getAdminEvents,
    getAdminStudents,
    deleteOrganization,
    createNodalOfficer,
    getNodalOfficers,
    updateNodalOfficer,
    deleteNodalOfficer,
    getGalleryImages,
    addGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
    getAdminHeads,
    addAdminHead,
    updateAdminHead,
    deleteAdminHead
} = require('../controllers/adminController');

// Stats and Records
router.get('/admin/stats', verifyToken, getAdminStats);
router.get('/admin/events', verifyToken, getAdminEvents);
router.get('/admin/all-students', verifyToken, getAdminStudents);
router.post('/admin/delete-organization', verifyToken, deleteOrganization);

// Nodal Officer CRUD (Admin only)
router.post('/admin/nodal-officer', verifyToken, createNodalOfficer);
router.get('/admin/nodal-officers', verifyToken, getNodalOfficers);
router.put('/admin/nodal-officer/:id', verifyToken, updateNodalOfficer);
router.delete('/admin/nodal-officer/:id', verifyToken, deleteNodalOfficer);

// Gallery
router.get('/gallery', getGalleryImages);
router.post('/admin/gallery', verifyToken, addGalleryImage);
router.put('/admin/gallery/:id', verifyToken, updateGalleryImage);
router.delete('/admin/gallery/:id', verifyToken, deleteGalleryImage);

// Administration Heads CRUD
router.get('/admin-heads', getAdminHeads);
router.post('/admin/admin-head', verifyToken, addAdminHead);
router.put('/admin/admin-head/:id', verifyToken, updateAdminHead);
router.delete('/admin/admin-head/:id', verifyToken, deleteAdminHead);

// General File Upload Endpoint
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const relativePath = `uploads/${req.file.filename}`;
    res.json({ success: true, filePath: relativePath });
});

module.exports = router;
