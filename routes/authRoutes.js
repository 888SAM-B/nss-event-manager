const express = require('express');
const router = express.Router();
const { loginCollege, loginUnit, loginAdmin, loginNodal } = require('../controllers/authController');

router.post('/login', loginCollege);
router.post('/unit-login', loginUnit);
router.post('/admin/login', loginAdmin);
router.post('/nodal/login', loginNodal);

module.exports = router;
