const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
    addOrganization,
    validateCollegeCode,
    registerCollege,
    regeneratePasskey,
    getCollegeDashboard,
    addAdoptedVillage,
    deleteAdoptedVillage
} = require('../controllers/collegeController');

router.post('/add-organization', verifyToken, addOrganization);
router.post('/validate-college-code', validateCollegeCode);
router.post('/register-college', registerCollege);
router.post('/admin/regenerate-passkey', verifyToken, regeneratePasskey);
router.get('/college-dashboard', verifyToken, getCollegeDashboard);
router.post('/add-village', verifyToken, addAdoptedVillage);
router.delete('/delete-village', verifyToken, deleteAdoptedVillage);

module.exports = router;
