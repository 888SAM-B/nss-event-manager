const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
    submitPeriodicalReport,
    getUnitPeriodicalReports,
    getUnitPeriodicalReportPrefill,
    getAdminPeriodicalReports,
    deletePeriodicalReport
} = require('../controllers/reportController');

router.post('/submit-periodical-report', verifyToken, submitPeriodicalReport);
router.get('/unit-periodical-reports/:unitCode/:collegeCode', verifyToken, getUnitPeriodicalReports);
router.get('/unit-periodical-report-prefill', verifyToken, getUnitPeriodicalReportPrefill);
router.get('/admin-periodical-reports', verifyToken, getAdminPeriodicalReports);
router.delete('/delete-periodical-report/:id', verifyToken, deletePeriodicalReport);

module.exports = router;
