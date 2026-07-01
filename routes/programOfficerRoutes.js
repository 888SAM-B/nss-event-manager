const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
    registerProgramOfficer,
    updateProgramOfficer,
    getProgramOfficers,
    deleteProgramOfficer,
    getUnassignedOfficers,
    assignOfficerToUnit,
    getAllProgramOfficers
} = require('../controllers/programOfficerController');

router.post('/register-program-officer', verifyToken, registerProgramOfficer);
router.post('/update-program-officer/:id', verifyToken, updateProgramOfficer);
router.get('/program-officers/:collegeCode', verifyToken, getProgramOfficers);
router.delete('/program-officer/:id', verifyToken, deleteProgramOfficer);
router.get('/unassigned-officers/:collegeCode', verifyToken, getUnassignedOfficers);
router.post('/assign-officer-to-unit', verifyToken, assignOfficerToUnit);
router.get('/admin/all-program-officers', verifyToken, getAllProgramOfficers);

module.exports = router;
