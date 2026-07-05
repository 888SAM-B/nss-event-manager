const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
    addEvent,
    respondCollaboration,
    getEvents,
    getUnitNotifications,
    deleteEvent,
    submitReport,
    updateEvent
} = require('../controllers/eventController');

router.post('/addEvent', verifyToken, addEvent);
router.put('/updateEvent', verifyToken, updateEvent);
router.post('/respond-collaboration', verifyToken, respondCollaboration);
router.get('/getEvents/:collegeCode/:unitCode', verifyToken, getEvents);
router.get('/unit-notifications/:unitCode/:collegeCode', verifyToken, getUnitNotifications);
router.post('/deleteEvent', verifyToken, deleteEvent);
router.post('/submitReport', verifyToken, submitReport);

module.exports = router;
