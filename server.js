const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require("cors");
const bcrypt = require('bcryptjs');
const verifyToken = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const mongoURI = process.env.MONGODB_URL;
console.log("MongoDB URL check:", mongoURI)

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

const unitSchema = new mongoose.Schema({
    name: String,
    head: String,
    password: String, // Hashed
    contact: String,
    mail: String,
    members: Array,
    unitNumber: String,
    createdDate: String,
    events: { type: Array, default: [] },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Unit = mongoose.model('Unit', unitSchema);

const insLoginScheme = new mongoose.Schema({
    userName: String,
    password: String, // Hashed
    insName: String,
    location: String,
    events: { type: Array, default: [] },
    code: String,
    units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }]
});

const User = mongoose.model('User', insLoginScheme);


const eventSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    singleDay: Boolean,
    date: String,
    dateFrom: String,
    dateTo: String,
    timeFrom: String,
    timeTo: String,
    venue: String,
    images: Array,
    eventCode: String,
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    collaborators: [{
        unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
        unitCode: String,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }],
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    report: {
        conductedOnDate: Boolean,
        participantsCount: Number,
        collegesCount: Number,
        outcome: String,
        reportFile: String, // PDF URL
        reportPhotos: Array, // Array of Image URLs
        submittedAt: { type: Date, default: Date.now }
    }
});

const Event = mongoose.model('Event', eventSchema);

// ... existing code ...

// Helper route to get all units for a college (for the dropdown in add-event)
app.get('/units/:collegeCode', async (req, res) => {
    const { collegeCode } = req.params;
    try {
        const college = await User.findOne({ code: collegeCode }).populate('units', 'unitNumber name _id');
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        res.json({ success: true, units: college.units });
    } catch (error) {
        console.error("Error fetching units:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/submitReport', verifyToken, async (req, res) => {
    // ... existing implementation
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
            // Allow if owner OR accepted collaborator
            const isCollaborator = event.collaborators.some(c => c.unitCode === req.user.unitNumber && c.status === 'accepted');

            if (req.user.unitNumber !== unit.unitNumber && !isCollaborator) {
                return res.status(403).json({ success: false, message: "Unauthorized to submit report for this event" });
            }
        } else if (req.user.role !== 'college' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        event.report = reportData;
        await event.save();

        res.json({ success: true, message: "Report submitted successfully", event });
    } catch (error) {
        console.error("Error submitting report:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Helper for Password Verification with Migration
const comparePassword = async (candidate, target, doc) => {
    // If target looks like a bcrypt hash
    if (target && target.startsWith('$2')) {
        return await bcrypt.compare(candidate, target);
    } else {
        // Plain text fallback + Migration
        if (candidate === target) {
            const salt = await bcrypt.genSalt(10);
            doc.password = await bcrypt.hash(candidate, salt);
            await doc.save();
            return true;
        }
        return false;
    }
}

app.get('/', (_req, res) => {
    res.send('Hello, World!');
});

app.post('/login', async (req, res) => {
    console.log('inside login');
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ userName: username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const isMatch = await comparePassword(password, user.password, user);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            { userName: username, userId: user._id, role: 'college' },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/add-organization', async (req, res) => {
    const { insName, location, code, username, password } = req.body;
    console.log("Add Organization Request:", req.body);
    try {
        const existingCode = await User.findOne({ code: code });
        if (existingCode) {
            return res.status(400).json({ success: false, message: "Organization code already exists" });
        }
        const existingUser = await User.findOne({ userName: username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            insName,
            location,
            code,
            userName: username,
            password: hashedPassword
        });
        await newUser.save();
        res.json({
            success: true,
            message: "Organization added successfully",
            user: newUser
        });
    } catch (error) {
        console.error("Error adding organization:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Protected: College Dashboard
app.get('/college-dashboard', verifyToken, async (req, res) => {
    const { username } = req.query;

    // Security Check: Ensure token owner matches requested username OR user is admin
    if (req.user.role !== 'admin' && req.user.userName !== username) {
        return res.status(403).json({ success: false, message: "Unauthorized access to this dashboard" });
    }

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "Username is required"
        });
    }

    const user = await User.findOne({ userName: username }).populate('units');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User not found"
        });
    }

    res.json({
        success: true,
        user
    });
});

// Protected: Add Unit
app.post('/addUnit', verifyToken, async (req, res) => {
    const { username, name, password, head, contact, mail, members, unitNumber, createdDate } = req.body;

    if (req.user.userName !== username && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthori`zed" });
    }

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    try {
        const user = await User.findOne({ userName: username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.units.length >= 6) {
            return res.status(400).json({ success: false, message: "Maximum 6 units allowed" });
        }

        // Hash the new unit password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUnit = new Unit({
            name,
            head,
            password: hashedPassword,
            contact,
            mail: mail,
            members,
            unitNumber,
            createdDate,
            collegeId: user._id
        });

        await newUnit.save();

        user.units.push(newUnit._id);
        await user.save();

        res.json({
            success: true,
            message: "Unit added successfully",
            unit: newUnit
        });
    } catch (error) {
        console.error("Error adding unit:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Protected: Delete Unit
app.delete('/deleteUnit', verifyToken, async (req, res) => {
    const { username, unitNumber } = req.body;

    if (req.user.userName !== username) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    try {
        const user = await User.findOne({ userName: username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const unit = await Unit.findOne({ unitNumber: unitNumber, collegeId: user._id });

        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        await Unit.findByIdAndDelete(unit._id);

        user.units.pull(unit._id);
        await user.save();

        res.json({
            success: true,
            message: "Unit deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting unit:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post('/unit-login', async (req, res) => {
    const { collegeCode, unitCode, unitPassword } = req.body;

    try {
        const user = await User.findOne({ code: collegeCode });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid college code" });
        }
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: user._id });
        if (!unit) {
            return res.status(401).json({ success: false, message: "Invalid unit code" });
        }

        const isMatch = await comparePassword(unitPassword, unit.password, unit);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid unit password" });
        }

        const token = jwt.sign({ unitNumber: unitCode, role: 'unit' }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Protected: Unit Dashboard
app.get('/unit-dashboard/:unitCode/:collegeCode', verifyToken, async (req, res) => {
    const { unitCode, collegeCode } = req.params;

    // Verification: token must belong to this unit OR be the college admin
    // Current token for unit has { unitNumber: unitCode }
    if (req.user.unitNumber && req.user.unitNumber !== unitCode) {
        return res.status(403).json({ success: false, message: "Unauthorized unit access" });
    }


    const collegeObject = await User.findOne({ code: collegeCode });
    if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });

    // Check Auth
    if (req.user.role === 'college') {
        // Verify this college owns the unit
        if (collegeObject.userName !== req.user.userName) {
            return res.status(403).json({ success: false, message: "Unauthorized college access" });
        }
    } else if (req.user.role === 'unit') {
        if (req.user.unitNumber !== unitCode) {
            return res.status(403).json({ success: false, message: "Unauthorized unit access" });
        }
    }

    const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeObject._id });
    if (!unit) {
        return res.status(401).json({ success: false, message: "Unit not found" });
    }

    res.json({ success: true, unit, college: collegeObject });
});

app.put('/update-unit-members', verifyToken, async (req, res) => {
    const { unitCode, members, collegeCode } = req.body;

    // Validation
    if (req.user.unitNumber && req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    const collegeObject = await User.findOne({ code: collegeCode });
    const collegeId = collegeObject._id;
    try {
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        unit.members = members;
        await unit.save();

        res.json({ success: true, message: "Members updated successfully", unit });
    } catch (error) {
        console.error("Error updating members:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post('/add-unit-member', verifyToken, async (req, res) => {
    const { unitCode, member, collegeCode } = req.body;

    if (req.user.unitNumber && req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    const collegeObject = await User.findOne({ code: collegeCode });
    const collegeId = collegeObject._id;

    try {
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        unit.members.push(member);
        await unit.save();

        res.json({ success: true, message: "Member added successfully", unit });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.delete('/delete-unit-member', verifyToken, async (req, res) => {
    const { unitCode, member, collegeCode } = req.body;

    if (req.user.unitNumber && req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    const collegeObject = await User.findOne({ code: collegeCode });
    const collegeId = collegeObject._id;
    try {
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }
        unit.members = unit.members.filter(m => m.regNo !== member.regNo);
        await unit.save();
        res.json({ success: true, message: "Member deleted successfully", unit });
    } catch (error) {
        console.error("Error deleting member:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


// ... existing code ...

app.post('/addEvent', verifyToken, async (req, res) => {
    const { eventData } = req.body;
    if (!eventData) {
        return res.status(400).json({ success: false, message: "Event details are required" });
    }

    // Auth Check
    if (req.user.role === 'unit') {
        if (req.user.unitNumber !== eventData.unitCode) return res.status(403).json({ message: "Unauthorized" });
    }

    const collegeObject = await User.findOne({ code: eventData.collegeCode });
    if (!collegeObject) return res.status(404).json({ message: "College found" }); // Typo in original? Keeping flow.

    // Fix: checking collegeObject existence properly
    if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });

    const collegeCodeId = collegeObject._id;

    try {
        const unit = await Unit.findOne({ unitNumber: eventData.unitCode, collegeId: collegeCodeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        // Process Collaborators
        let processedCollaborators = [];
        if (eventData.collaborators && eventData.collaborators.length > 0) {
            // Find IDs for unit codes
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
        const eventCode = `${eventData.collegeCode}${eventData.unitCode}${String(eventNumber).padStart(3, '0')}`;

        const newEvent = new Event({
            ...eventData,
            eventCode,
            unitId: unit._id,
            collegeId: collegeCodeId,
            collaborators: processedCollaborators
        });
        await newEvent.save();
        unit.events.push(newEvent._id);
        collegeObject.events.push(newEvent._id)
        await unit.save();
        await collegeObject.save();
        res.json({ success: true, message: "Event added and invitations sent", event: newEvent });
    } catch (error) {
        console.error("Error adding event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Get Notifications (Pending Invites) for a Unit
app.get('/unit-notifications/:unitCode/:collegeCode', verifyToken, async (req, res) => {
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
        }).populate('unitId', 'name unitNumber'); // Creator unit info

        res.json({ success: true, invites: pendingEvents });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Respond to Collaboration Invite
app.post('/respond-collaboration', verifyToken, async (req, res) => {
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
        await event.save();

        if (response === 'accepted') {
            const college = await User.findOne({ code: collegeCode });
            const collabUnit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id });
            if (collabUnit) {
                collabUnit.events.push(event._id);
                await collabUnit.save();
            }
        }

        res.json({ success: true, message: `Invitation ${response}` });
    } catch (error) {
        console.error("Error responding to invite:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.get('/getEvents/:collegeCode/:unitCode', async (req, res) => {
    // This might be public? Or protected? 
    // Assuming public for "Explore" functionality, but let's check frontend.
    // 'explore-event.jsx' uses it.
    // If it's public, I won't add verifiedToken, OR make it optional.
    // I'll leave it public for now as "Explore" usually implies public visibility.

    const { collegeCode, unitCode } = req.params;
    console.log(`Getting events for College: ${collegeCode}, Unit: ${unitCode}`);

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(401).json({ success: false, message: "Invalid college code" });
        }
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id });
        if (!unit) {
            return res.status(401).json({ success: false, message: "Invalid unit code" });
        }

        // Unit Events: Created by unit OR Collaborated (accepted)
        const unitEvents = await Event.find({
            $or: [
                { unitId: unit._id },
                {
                    collaborators: {
                        $elemMatch: {
                            unitCode: unitCode,
                            status: 'accepted'
                        }
                    }
                }
            ]
        });

        // College Events: Other events in the college, EXCLUDING those where this unit is already a creator or collaborator
        const collegeEvents = await Event.find({
            $and: [
                { collegeId: college._id },
                { unitId: { $ne: unit._id } },
                {
                    collaborators: {
                        $not: {
                            $elemMatch: {
                                unitCode: unitCode,
                                status: 'accepted'
                            }
                        }
                    }
                }
            ]
        });

        const otherEvents = await Event.find({ $and: [{ collegeId: { $ne: college._id } }, { unitId: { $ne: unit._id } }] });

        console.log(`Fetched ${unitEvents.length} unit events, ${collegeEvents.length} college events`);

        res.json({ success: true, unitEvents, collegeEvents, otherEvents });
    } catch (error) {
        console.error("Error in getEvents:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/deleteEvent', verifyToken, async (req, res) => {
    const { eventId, unitCode, collegeCode } = req.body;

    if (!eventId || !unitCode || !collegeCode) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (req.user.role === 'unit' && req.user.unitNumber !== unitCode) {
        return res.status(403).json({ message: "Unauthorized" });
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

        await Unit.updateOne(
            { _id: unit._id },
            { $pull: { events: new mongoose.Types.ObjectId(eventId) } }
        );

        await User.updateOne(
            { _id: college._id },
            { $pull: { events: new mongoose.Types.ObjectId(eventId) } }
        );

        res.json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.put('/updateEvent', verifyToken, async (req, res) => {
    const { eventId, eventData } = req.body;

    if (!eventId || !eventData) {
        return res.status(400).json({ success: false, message: "Event ID and details are required" });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check ownership via unit
        const unit = await Unit.findById(event.unitId);
        if (req.user.role === 'unit' && req.user.unitNumber !== unit.unitNumber) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        Object.assign(event, eventData);

        await event.save();
        res.json({ success: true, message: "Event updated successfully", event });

    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// --- ADMIN ROUTES ---

// Admin Login
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Simple environment variable check
    console.log(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin', username: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Invalid Admin Credentials" });
    }
});

// Admin: Delete Organization and all associated data
app.post('/admin/delete-organization', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const { collegeId, adminUsername, adminPassword } = req.body;

    if (!collegeId || !adminUsername || !adminPassword) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Verify Admin Credentials again for security
    if (adminUsername !== process.env.ADMIN_USERNAME || adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: "Invalid Admin Credentials" });
    }

    try {
        const college = await User.findById(collegeId);
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // Delete all events associated with this college
        await Event.deleteMany({ collegeId: collegeId });

        // Delete all units associated with this college
        await Unit.deleteMany({ collegeId: collegeId });

        // Delete the college itself
        await User.findByIdAndDelete(collegeId);

        res.json({ success: true, message: "Organization and all associated data deleted successfully" });
    } catch (error) {
        console.error("Error deleting organization:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Admin Stats for Dashboard
app.get('/admin/stats', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    try {
        const totalColleges = await User.countDocuments();
        const totalUnits = await Unit.countDocuments();
        const totalEvents = await Event.countDocuments();

        // Group events by category for chart
        const eventsByCategory = await Event.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        // Get events with dates for calendar view
        const allEvents = await Event.find({}, 'name date dateFrom dateTo singleDay category eventCode')
            .populate('collegeId', 'insName code')
            .populate('unitId', 'name unitNumber');

        // Get list of colleges with their unit counts for a table
        const colleges = await User.find({}, 'insName code events userName').populate('units', 'unitNumber name');

        res.json({
            success: true,
            stats: {
                totalColleges,
                totalUnits,
                totalEvents,
                eventsByCategory,
                colleges,
                allEvents
            }
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Admin: Get All Events with Details
app.get('/admin/events', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    try {
        const events = await Event.find({})
            .populate('collegeId', 'insName code')
            .populate('unitId', 'name unitNumber head')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            events
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});