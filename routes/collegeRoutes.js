const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
    addOrganization,
    validateCollegeCode,
    sendCollegeOtp,
    verifyCollegeOtp,
    registerCollege,
    regeneratePasskey,
    getCollegeDashboard,
    addAdoptedVillage,
    deleteAdoptedVillage,
    bulkAddOrganizations
} = require('../controllers/collegeController');

router.post('/add-organization', verifyToken, addOrganization);
router.post('/admin/bulk-add-organizations', verifyToken, bulkAddOrganizations);
router.post('/validate-college-code', validateCollegeCode);
router.post('/send-college-otp', sendCollegeOtp);
router.post('/verify-college-otp', verifyCollegeOtp);
router.post('/register-college', registerCollege);
router.post('/admin/regenerate-passkey', verifyToken, regeneratePasskey);
router.get('/college-dashboard', verifyToken, getCollegeDashboard);
router.post('/add-village', verifyToken, addAdoptedVillage);
// BUG-04: Changed from DELETE to POST — body not reliably available on DELETE requests in Express 5
router.post('/delete-village', verifyToken, deleteAdoptedVillage);

module.exports = router;

