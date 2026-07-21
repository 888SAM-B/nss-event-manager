const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const {
    createCircular,
    getCirculars,
    deleteCircular
} = require('../controllers/circularController');

// Publish circular (Admin or District Nodal Officer)
router.post('/circulars', verifyToken, verifyRole(['admin', 'nodal']), upload.array('files', 5), createCircular);

// Get circulars (accessible to all authenticated roles, filtered appropriately)
router.get('/circulars', verifyToken, getCirculars);

// Delete circular
router.delete('/circulars/:id', verifyToken, verifyRole(['admin', 'nodal']), deleteCircular);

module.exports = router;
