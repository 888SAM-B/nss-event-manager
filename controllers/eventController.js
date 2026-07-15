const mongoose = require('mongoose');
const Event = require('../models/Event');
const Unit = require('../models/Unit');
const User = require('../models/User');
const { verifyOwnership } = require('../middlewares/auth');
const { sendEmailViaBrevo } = require('../services/emailService');

// Create new Event
const addEvent = async (req, res) => {
    const { eventData } = req.body;
    if (!eventData) {
        return res.status(400).json({ success: false, message: "Event details are required" });
    }

    if (!(await verifyOwnership(req, eventData.collegeCode, eventData.unitCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const collegeObject = await User.findOne({ code: eventData.collegeCode });
        if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });

        const collegeCodeId = collegeObject._id;

        const unit = await Unit.findOne({ unitNumber: eventData.unitCode, collegeId: collegeCodeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        // Process Collaborators (Co-organizers)
        let processedCollaborators = [];
        if (eventData.collaborators && eventData.collaborators.length > 0) {
            for (const collabUnitCode of eventData.collaborators) {
                const collabUnit = await Unit.findOne({ unitNumber: collabUnitCode, collegeId: collegeCodeId });
                if (collabUnit) {
                    processedCollaborators.push({
                        unitId: collabUnit._id,
                        unitCode: collabUnit.unitNumber,
                        status: 'pending'
                    });
                }
            }
        }

        const eventCount = await Event.countDocuments({ unitId: unit._id });
        const eventNumber = eventCount + 1;
        const eventCode = `NSSEVT${eventData.unitCode}${String(eventNumber).padStart(3, '0')}`;

        const newEvent = new Event({
            ...eventData,
            eventCode,
            unitId: unit._id,
            collegeId: collegeCodeId,
            collaborators: processedCollaborators,
            coOrganizers: [] // starts with empty until co-organizer accepts
        });

        await newEvent.save();

        unit.events.push(newEvent._id);
        collegeObject.events.push(newEvent._id);
        await unit.save();
        await collegeObject.save();

        // Send Email Notification to ALL Unit Heads
        try {
            const allUnits = await Unit.find({}, 'mail head');
            const recipientEmails = allUnits.map(u => u.mail).filter(email => email);

            if (recipientEmails.length > 0) {
                await sendEmailViaBrevo({
                    bcc: recipientEmails,
                    subject: `New NSS Event: ${newEvent.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <h2 style="color: #2c3e50;">${newEvent.name}</h2>
                            <p>Dear <strong>NSS Unit Heads</strong>,</p>
                            <p>A new NSS event has been registered in the system.</p>
                            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>Event Name:</strong> ${newEvent.name}</p>
                                <p><strong>Event Code:</strong> ${newEvent.eventCode}</p>
                                <p><strong>Category:</strong> ${newEvent.category}</p>
                                <p><strong>Date:</strong> ${newEvent.singleDay ? newEvent.date : `${newEvent.dateFrom} to ${newEvent.dateTo}`}</p>
                                <p><strong>Venue:</strong> ${newEvent.venue}</p>
                                <p><strong>Organized By:</strong> Unit ${unit.unitNumber} (${unit.name})</p>
                            </div>
                            <p>For more details, please visit the NSS Event Management Portal.</p>
                        </div>
                    `
                });
            }
        } catch (emailErr) {
            console.error("Failed to fetch units for email notification:", emailErr);
        }

        res.json({ success: true, message: "Event added and invitations sent", event: newEvent });
    } catch (error) {
        console.error("Error adding event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Respond to Collaboration Invitation
const respondCollaboration = async (req, res) => {
    const { eventId, unitCode, response, collegeCode } = req.body; // response: 'accepted' or 'rejected'

    if (req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const collaboratorIndex = event.collaborators.findIndex(
            c => c.unitCode === unitCode && c.status === 'pending'
        );

        if (collaboratorIndex === -1) {
            return res.status(400).json({ message: "No pending invite found" });
        }

        event.collaborators[collaboratorIndex].status = response;

        if (response === 'accepted') {
            const college = await User.findOne({ code: collegeCode });
            const collabUnit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id });
            if (collabUnit) {
                collabUnit.events.push(event._id);
                await collabUnit.save();

                // Add to co-organizers array (V2 feature)
                if (!event.coOrganizers.includes(collabUnit._id)) {
                    event.coOrganizers.push(collabUnit._id);
                }
            }
        }

        await event.save();
        res.json({ success: true, message: `Invitation ${response}` });
    } catch (error) {
        console.error("Error responding to invite:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Fetch Events for a College/Unit (checks creator + accepted co-organizers)
const getEvents = async (req, res) => {
    const { collegeCode, unitCode } = req.params;

    try {
        const uCode = (unitCode && unitCode !== 'null' && unitCode !== 'undefined' && unitCode !== 'COLLEGE') ? unitCode : null;
        if (!(await verifyOwnership(req, collegeCode, uCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(401).json({ success: false, message: "Invalid college code" });
        }

        let unitEvents = [];
        let collegeEvents = [];
        let externalEvents = [];

        if (unitCode && unitCode !== 'null' && unitCode !== 'undefined' && unitCode !== 'COLLEGE') {
            const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id });
            if (unit) {
                // Unit Events: Created by unit OR Co-Organized
                unitEvents = await Event.find({
                    $or: [
                        { unitId: unit._id },
                        { coOrganizers: unit._id }
                    ],
                    isExternal: { $ne: true }
                }).populate('attendees unitId coOrganizers');

                // College Events: Other events in the college
                collegeEvents = await Event.find({
                    collegeId: college._id,
                    unitId: { $ne: unit._id },
                    coOrganizers: { $ne: unit._id },
                    isExternal: { $ne: true }
                }).populate('attendees unitId coOrganizers');

                // External Events
                externalEvents = await Event.find({
                    unitId: unit._id,
                    isExternal: true
                }).populate('attendees unitId coOrganizers');
            } else {
                collegeEvents = await Event.find({ collegeId: college._id, isExternal: { $ne: true } }).populate('attendees unitId coOrganizers');
            }
        } else {
            collegeEvents = await Event.find({ collegeId: college._id, isExternal: { $ne: true } }).populate('attendees unitId coOrganizers');
        }

        const otherEvents = await Event.find({ collegeId: { $ne: college._id }, isExternal: { $ne: true } }).populate('attendees unitId coOrganizers');

        res.json({ success: true, unitEvents, collegeEvents, otherEvents, externalEvents });
    } catch (error) {
        console.error("Error in getEvents:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get Pending Invites for a Unit
const getUnitNotifications = async (req, res) => {
    const { unitCode, collegeCode } = req.params;

    if (req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) return res.status(404).json({ message: "College not found" });

        const pendingEvents = await Event.find({
            collegeId: college._id,
            'collaborators': {
                $elemMatch: {
                    unitCode: unitCode,
                    status: 'pending'
                }
            }
        }).populate('unitId', 'name unitNumber');

        res.json({ success: true, invites: pendingEvents });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete Event
const deleteEvent = async (req, res) => {
    const { eventId, unitCode, collegeCode } = req.body;

    if (!eventId || !unitCode || !collegeCode) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!(await verifyOwnership(req, collegeCode, unitCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        const event = await Event.findOne({ _id: eventId, unitId: unit._id });
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found or unauthorized" });
        }

        await Event.findByIdAndDelete(eventId);

        // Remove event reference from all units and colleges
        await Unit.updateMany({ events: eventId }, { $pull: { events: eventId } });
        await User.updateMany({ events: eventId }, { $pull: { events: eventId } });

        res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Submit Event Report (V2: updates report without altering attendees array since attendance is separate)
const submitReport = async (req, res) => {
    const { eventId, reportData } = req.body;

    if (!eventId || !reportData) {
        return res.status(400).json({ success: false, message: "Event ID and report data are required" });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Authorization check
        if (req.user.role === 'unit') {
            const unit = await Unit.findById(event.unitId);
            const isCollaborator = event.collaborators.some(c => c.unitCode === req.user.unitNumber && c.status === 'accepted');

            if (req.user.unitNumber !== unit.unitNumber && !isCollaborator) {
                return res.status(403).json({ success: false, message: "Unauthorized to submit report for this event" });
            }
        } else if (req.user.role !== 'college' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // Exclude attendees from reportData updates in this route (V2 requirement: attendance section removed from report)
        const { attendees, ...cleanReportData } = reportData;

        // Save report data
        event.report = {
            ...event.report,
            ...cleanReportData,
            submittedAt: new Date()
        };

        await event.save();
        res.json({ success: true, message: "Report submitted successfully", event });
    } catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Update Event
const updateEvent = async (req, res) => {
    const { eventId, eventData } = req.body;
    if (!eventId || !eventData) {
        return res.status(400).json({ success: false, message: "Event ID and event details are required" });
    }

    if (!(await verifyOwnership(req, eventData.collegeCode, eventData.unitCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, message: "Event not found" });

        // Update fields
        const updatableFields = [
            'name', 'description', 'category', 'singleDay', 'date', 'dateFrom', 'dateTo',
            'timeFrom', 'timeTo', 'venue', 'resourcePerson', 'level', 'sponsorship',
            'registeredMeriBharath', 'meriBharathUrl', 'images', 'brochure', 'attendees', 'isExternal'
        ];

        updatableFields.forEach(field => {
            if (eventData[field] !== undefined) {
                event[field] = eventData[field];
            }
        });

        if (event.registeredMeriBharath === 'No') {
            event.meriBharathUrl = '';
        }

        await event.save();
        res.json({ success: true, message: "Event updated successfully", event });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    addEvent,
    respondCollaboration,
    getEvents,
    getUnitNotifications,
    deleteEvent,
    submitReport,
    updateEvent
};
