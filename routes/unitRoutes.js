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
    deleteUnitMember
} = require('../controllers/unitController');

router.post('/addUnit', verifyToken, addUnit);
router.delete('/deleteUnit', verifyToken, deleteUnit);
router.get('/units/:collegeCode', verifyToken, getUnits);
router.get('/unit-dashboard/:unitCode/:collegeCode', verifyToken, getUnitDashboard);
router.get('/college-members/:collegeCode', verifyToken, getCollegeMembers);
router.put('/update-unit-member', verifyToken, updateUnitMember);
router.delete('/bulk-delete-members', verifyToken, bulkDeleteMembers);
router.post('/bulk-add-members', verifyToken, bulkAddMembers);
router.post('/add-unit-member', verifyToken, addUnitMember);
router.delete('/delete-unit-member', verifyToken, deleteUnitMember);

module.exports = router;
