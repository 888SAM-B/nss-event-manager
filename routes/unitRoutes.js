const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
    addUnit,
    deleteUnit,
    getUnits,
    getUnitDashboard,
    getCollegeMembers,
    updateUnitMember,
    bulkDeleteMembers,
    bulkAddMembers,
    addUnitMember,
    deleteUnitMember,
    sendUnitBankOtp,
    updateUnitBankDetails
} = require('../controllers/unitController');

router.post('/addUnit', verifyToken, addUnit);
// BUG-01: Changed from DELETE to POST — Express 5 + HTTP clients don't reliably send body on DELETE
router.post('/deleteUnit', verifyToken, deleteUnit);
router.get('/units/:collegeCode', verifyToken, getUnits);
router.get('/unit-dashboard/:unitCode/:collegeCode', verifyToken, getUnitDashboard);
router.get('/college-members/:collegeCode', verifyToken, getCollegeMembers);
router.put('/update-unit-member', verifyToken, updateUnitMember);
// BUG-02: Changed from DELETE to POST — body not reliably available on DELETE
router.post('/bulk-delete-members', verifyToken, bulkDeleteMembers);
router.post('/bulk-add-members', verifyToken, bulkAddMembers);
router.post('/add-unit-member', verifyToken, addUnitMember);
// BUG-03: Changed from DELETE to POST — body not reliably available on DELETE
router.post('/delete-unit-member', verifyToken, deleteUnitMember);
router.post('/send-unit-bank-otp', verifyToken, sendUnitBankOtp);
router.post('/update-unit-bank-details', verifyToken, updateUnitBankDetails);

module.exports = router;
