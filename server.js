const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require("cors");
const bcrypt = require('bcryptjs');
const verifyToken = require('./middleware/auth');
// Verify Brevo API configuration on startup
if (process.env.BREVO_API_KEY) {
    console.log('✅ Brevo Email service is configured');
} else {
    console.warn('⚠️ BREVO_API_KEY is not set in environment variables');
}

const sendEmailViaBrevo = async ({ from, to, subject, html, bcc }) => {
    const formatEmail = (email) => {
        if (typeof email === 'object') return email;
        return { email };
    };

    const toArr = Array.isArray(to) ? to.map(formatEmail) : (to ? [{ email: to }] : []);
    const bccArr = Array.isArray(bcc) ? bcc.map(formatEmail) : (bcc ? [{ email: bcc }] : []);

    const payload = {
        sender: formatEmail(from || process.env.EMAIL_USER || 'noreply@example.com'),
        subject: subject,
        htmlContent: html,
    };

    if (toArr.length > 0) payload.to = toArr;

    // Brevo usually requires at least one 'to' recipient. If only 'bcc' is present, set an initial 'to' as the sender
    if (toArr.length === 0 && bccArr.length > 0) {
        payload.to = [formatEmail(from || process.env.EMAIL_USER || 'noreply@example.com')];
    }

    if (bccArr.length > 0) payload.bcc = bccArr;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errData = await response.text();
        if (contentType && contentType.includes('application/json')) {
            try { errData = JSON.parse(errData); } catch (e) { }
        }
        const error = new Error(`Brevo API Error: ${typeof errData === 'object' ? JSON.stringify(errData) : errData}`);
        error.code = response.status;
        throw error;
    }

    const data = await response.json();
    return { response: '250 Message queued', messageId: data.messageId || 'unknown' };
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT;
const mongoURI = process.env.MONGODB_URL;
console.log("MongoDB URL check:", mongoURI)

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

const memberSchema = new mongoose.Schema({
    name: String,
    regNo: String,
    dept: String,
    course: String,
    community: String,
    contact: String,
    bloodGroup: String,
    dob: String,
    batchFrom: String,
    batchTo: String,
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Annexure-A Enrolment Fields
    fatherName: String,
    fatherPhone: String,
    sex: String,
    height: String,
    weight: String,
    aadhaar: String,
    enrolmentDate: String,
    culturalTalents: String,
    hobbies: String,
    address: String,
    enrolmentNo: String,
    remarks: String,
    universityName: String,
    email: String,
    isEnrolled: { type: Boolean, default: false }
});

const Member = mongoose.model('Member', memberSchema);

const unitSchema = new mongoose.Schema({
    name: String,
    head: { type: mongoose.Schema.Types.Mixed, ref: 'ProgramOfficer' }, // Mixed to support legacy names and new ObjectIds
    contact: String, // Legacy/Backup contact
    mail: String,    // Legacy/Backup mail
    password: String, // Hashed
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
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
    universityName: { type: String, default: "" },
    events: { type: Array, default: [] },
    code: String,
    units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],
    adoptingVillages: [{
        name: String,
        address: String,
        pincode: String
    }]
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
    brochure: String,
    eventCode: String,
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
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

const programOfficerSchema = new mongoose.Schema({
    // Main Details
    name: String,
    designation: String,
    department: String,
    unit: String,
    college: String,

    // Personal Details
    image: String, // Base64 or URL
    dob: String,
    community: String, // SC/ST/OBC/General
    email: String,
    mobile: String,
    address: String,
    dateOfAppointment: String,
    teachingExperience: String,

    // Academic
    qualification: String,
    seminars: [String],
    etiCompleted: String, // Yes/No

    // General
    nssExperience: [String],
    specialTalent: [String],

    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officerID: String,
    createdAt: { type: Date, default: Date.now }
});

const ProgramOfficer = mongoose.model('ProgramOfficer', programOfficerSchema);

// ... existing code ...

app.post('/register-program-officer', verifyToken, async (req, res) => {
    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        const officerCount = await ProgramOfficer.countDocuments({ collegeId: college._id });
        const officerID = `NSSPO${college.code}${String(officerCount + 1).padStart(2, '0')}`;

        const newOfficer = new ProgramOfficer({
            ...officerData,
            collegeId: college._id,
            officerID
        });

        await newOfficer.save();

        // If a specific unit was selected, update that unit's head reference
        if (officerData.unit) {
            await Unit.findOneAndUpdate(
                { unitNumber: officerData.unit, collegeId: college._id },
                { head: newOfficer._id }
            );
        }

        res.json({ success: true, message: "Program Officer registered successfully", officer: newOfficer });
    } catch (error) {
        console.error("Error registering program officer:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.get('/program-officers/:collegeCode', verifyToken, async (req, res) => {
    try {
        const { collegeCode } = req.params;
        const college = await User.findOne({ code: collegeCode });
        if (!college) return res.status(404).json({ success: false, message: "College not found" });

        const officers = await ProgramOfficer.find({ collegeId: college._id });
        res.json({ success: true, officers });
    } catch (error) {
        console.error("Error fetching program officers:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.delete('/program-officer/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const officer = await ProgramOfficer.findById(id);
        if (!officer) return res.status(404).json({ success: false, message: "Officer not found" });

        // If officer was assigned to a unit, clear that unit's head
        if (officer.unit) {
            await Unit.findOneAndUpdate(
                { unitNumber: officer.unit, collegeId: officer.collegeId },
                { $set: { head: null } }
            );
        }

        await ProgramOfficer.findByIdAndDelete(id);
        res.json({ success: true, message: "Program Officer removed successfully" });
    } catch (error) {
        console.error("Error deleting program officer:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

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

        const { attendees, ...reportDataWithoutAttendees } = reportData;

        event.report = reportDataWithoutAttendees;
        if (attendees) {
            event.attendees = attendees;
        }
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

// Test Email Endpoint - For debugging email issues
app.post('/test-email', async (req, res) => {
    const { testEmail } = req.body;

    if (!testEmail) {
        return res.status(400).json({
            success: false,
            message: "Please provide a testEmail in the request body"
        });
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: testEmail,
            subject: 'Test Email from NSS Portal',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>✅ Email Configuration Test</h2>
                    <p>If you're reading this, nodemailer is working correctly on Render!</p>
                    <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
                </div>
            `
        };

        const info = await sendEmailViaBrevo(mailOptions);

        console.log('✅ Test email sent successfully:', info.response);
        res.json({
            success: true,
            message: 'Test email sent successfully!',
            info: info.response,
            messageId: info.messageId
        });
    } catch (error) {
        console.error('❌ Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message,
            code: error.code
        });
    }
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
    const { insName, location, code, username, password, adoptingVillages } = req.body;
    console.log("Add Organization Request:", req.body);
    try {
        const existingCode = await User.findOne({ code: code });
        if (existingCode) {
            return res.status(400).json({ success: false, message: "College code already exists" });
        }
        const existingUser = await User.findOne({ userName: username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Admin email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            insName,
            location,
            code,
            userName: username,
            password: hashedPassword,
            adoptingVillages: adoptingVillages || []
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

    const user = await User.findOne({ userName: username }).populate({
        path: 'units',
        populate: { path: 'head' }
    });

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
        return res.status(403).json({ success: false, message: "Unauthorized" });
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
            password: hashedPassword,
            members: [], // Initialize with empty, will push IDs below
            unitNumber,
            createdDate,
            collegeId: user._id
        });

        await newUnit.save();

        // Create Member documents if initial members are provided
        if (members && members.length > 0) {
            const memberDocs = members.map(m => ({
                ...m,
                unitId: newUnit._id,
                collegeId: user._id
            }));
            const createdMembers = await Member.insertMany(memberDocs);
            newUnit.members = createdMembers.map(m => m._id);
            await newUnit.save();
        }

        user.units.push(newUnit._id);
        await user.save();

        const populatedUnit = await Unit.findById(newUnit._id).populate('members');

        res.json({
            success: true,
            message: "Unit added successfully",
            unit: populatedUnit
        });
    } catch (error) {
        console.error("Error adding unit:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Protected: Delete Unit
app.delete('/deleteUnit', verifyToken, async (req, res) => {
    const { username, unitNumber } = req.body;

    if (req.user.userName !== username && req.user.role !== 'admin') {
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

    const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeObject._id })
        .populate('members')
        .populate('head');
    if (!unit) {
        return res.status(401).json({ success: false, message: "Unit not found" });
    }

    res.json({ success: true, unit, college: collegeObject });
});

app.put('/update-unit-member', verifyToken, async (req, res) => {
    const { memberId, memberData } = req.body;

    try {
        const updatedMember = await Member.findByIdAndUpdate(memberId, memberData, { new: true });
        if (!updatedMember) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        res.json({ success: true, message: "Member updated successfully", member: updatedMember });
    } catch (error) {
        console.error("Error updating member:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.get('/college-members/:collegeCode', verifyToken, async (req, res) => {
    const { collegeCode } = req.params;

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        const members = await Member.find({ collegeId: college._id }).populate('unitId', 'unitNumber name');
        res.json({ success: true, members });
    } catch (error) {
        console.error("Error fetching college members:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.delete('/bulk-delete-members', verifyToken, async (req, res) => {
    const { unitCode, memberIds, collegeCode } = req.body;

    if (req.user.unitNumber && req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    const collegeObject = await User.findOne({ code: collegeCode });
    if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });
    const collegeId = collegeObject._id;

    try {
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        await Member.deleteMany({ _id: { $in: memberIds } });
        unit.members.pull(...memberIds);
        await unit.save();

        const updatedUnit = await Unit.findById(unit._id).populate('members');
        res.json({ success: true, message: "Members deleted successfully", unit: updatedUnit });
    } catch (error) {
        console.error("Error bulk deleting members:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post('/bulk-add-members', verifyToken, async (req, res) => {
    const { unitCode, collegeCode, members } = req.body;

    if (req.user.unitNumber && req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    try {
        const user = await User.findOne({ code: collegeCode });
        if (!user) return res.status(404).json({ success: false, message: "College not found" });

        try {
            const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: user._id })
                .populate('members')
                .populate('head');
            if (!unit) {
                return res.status(404).json({ success: false, message: "Unit not found" });
            }

            const memberDocs = members.map(m => ({
                ...m,
                unitId: unit._id,
                collegeId: user._id
            }));

            const createdMembers = await Member.insertMany(memberDocs);
            const memberIds = createdMembers.map(m => m._id);

            unit.members.push(...memberIds);
            await unit.save();

            const updatedUnit = await Unit.findById(unit._id).populate('members');
            res.json({ success: true, message: `${createdMembers.length} members added successfully`, unit: updatedUnit });
        } catch (error) {
            console.error("Error bulk adding members:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    } catch (error) {
        console.error("Outer error in bulk-add-members:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post('/add-unit-member', verifyToken, async (req, res) => {
    const { unitCode, member, collegeCode } = req.body;

    if (req.user.unitNumber && req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    const collegeObject = await User.findOne({ code: collegeCode });
    if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });
    const collegeId = collegeObject._id;

    try {
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        const newMember = new Member({
            ...member,
            unitId: unit._id,
            collegeId: collegeId
        });
        await newMember.save();

        unit.members.push(newMember._id);
        await unit.save();

        const updatedUnit = await Unit.findById(unit._id).populate('members');

        res.json({ success: true, message: "Member added successfully", unit: updatedUnit });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.delete('/delete-unit-member', verifyToken, async (req, res) => {
    const { unitCode, memberId, collegeCode } = req.body;

    if (req.user.unitNumber && req.user.unitNumber !== unitCode) return res.status(403).json({ message: "Unauthorized" });

    const collegeObject = await User.findOne({ code: collegeCode });
    if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });
    const collegeId = collegeObject._id;

    try {
        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: collegeId });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        await Member.findByIdAndDelete(memberId);
        unit.members.pull(memberId);
        await unit.save();

        const updatedUnit = await Unit.findById(unit._id).populate('members');
        res.json({ success: true, message: "Member deleted successfully", unit: updatedUnit });
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
        const eventCode = `NSSEVT${eventData.unitCode}${String(eventNumber).padStart(3, '0')}`;

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

        // Send Email Notification to ALL Unit Heads
        try {
            const allUnits = await Unit.find({}, 'mail head');
            const recipientEmails = allUnits.map(u => u.mail).filter(email => email);

            if (recipientEmails.length > 0) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    bcc: recipientEmails, // Use BCC to hide other emails
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
                            <br/>
                            <p>Regards,<br/>NSS Management System</p>
                        </div>
                    `
                };

                try {
                    const info = await sendEmailViaBrevo(mailOptions);
                    console.log('✅ Bulk event email sent successfully:', info.response);
                    console.log(`📧 Sent to ${recipientEmails.length} recipients`);
                } catch (error) {
                    console.error('❌ Error sending bulk email:', error.message);
                    console.error('Error code:', error.code);
                    // Don't fail the event creation if email fails
                }
            } else {
                console.log('⚠️ No unit emails found to send notifications');
            }
        } catch (emailErr) {
            console.error("Failed to fetch units for email notification:", emailErr);
        }

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

        let unitEvents = [];
        let collegeEvents = [];

        // Check if unitCode is valid or should be skipped (for college-level view)
        if (unitCode && unitCode !== 'null' && unitCode !== 'undefined' && unitCode !== 'COLLEGE') {
            const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id });
            if (unit) {
                // Unit Events: Created by unit OR Collaborated (accepted)
                unitEvents = await Event.find({
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
                }).populate('attendees');

                // College Events: Other events in the college, EXCLUDING those where this unit is already a creator or collaborator
                collegeEvents = await Event.find({
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
                }).populate('attendees');
            } else {
                // If unitCode provided but not found, return empty unitEvents and show all college events
                collegeEvents = await Event.find({ collegeId: college._id }).populate('attendees');
            }
        } else {
            // College Level View: No specific unit
            collegeEvents = await Event.find({ collegeId: college._id }).populate('attendees');
        }

        const otherEvents = await Event.find({ $and: [{ collegeId: { $ne: college._id } }] }).populate('attendees');

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
        const event = await Event.findById(eventId).populate('unitId');
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // Check ownership via unit
        const unit = event.unitId;
        if (req.user.role === 'unit' && req.user.unitNumber !== unit.unitNumber) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Detect major changes (date/time) for email notification
        const isMajorUpdate =
            event.date !== eventData.date ||
            event.dateFrom !== eventData.dateFrom ||
            event.dateTo !== eventData.dateTo ||
            event.timeFrom !== eventData.timeFrom ||
            event.timeTo !== eventData.timeTo;

        Object.assign(event, eventData);
        await event.save();

        // Send Email Notification to ALL Unit Heads if major details updated
        if (isMajorUpdate) {
            try {
                const allUnits = await Unit.find({}, 'mail');
                const recipientEmails = allUnits.map(u => u.mail).filter(email => email);

                if (recipientEmails.length > 0) {
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        bcc: recipientEmails,
                        subject: `EVENT UPDATE: ${event.name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1 solid #ffcc00; border-radius: 10px;">
                                <h2 style="color: #d35400;">Event Update: ${event.name}</h2>
                                <p>Dear <strong>NSS Unit Heads</strong>,</p>
                                <p>This is to inform you that the schedule for the following NSS event has been updated:</p>
                                <div style="background-color: #fff9e6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #ffcc00;">
                                    <p><strong>Event Name:</strong> ${event.name}</p>
                                    <p><strong>Event Code:</strong> ${event.eventCode}</p>
                                    <p><strong>New Date:</strong> ${event.singleDay ? event.date : `${event.dateFrom} to ${event.dateTo}`}</p>
                                    <p><strong>New Time:</strong> ${event.timeFrom} - ${event.timeTo}</p>
                                    <p><strong>Venue:</strong> ${event.venue}</p>
                                    <p><strong>Organized By:</strong> Unit ${unit.unitNumber} (${unit.name})</p>
                                </div>
                                <p>Please review the updated details on the NSS Portal.</p>
                                <br/>
                                <p>Regards,<br/>NSS Management System</p>
                            </div>
                        `
                    };

                    try {
                        const info = await sendEmailViaBrevo(mailOptions);
                        console.log('✅ Bulk update email sent successfully:', info.response);
                        console.log(`📧 Sent to ${recipientEmails.length} recipients`);
                    } catch (error) {
                        console.error('❌ Error sending bulk update email:', error.message);
                        console.error('Error code:', error.code);
                    }
                } else {
                    console.log('⚠️ No unit emails found for update notification');
                }
            } catch (emailErr) {
                console.error("Failed to fetch units for update notification:", emailErr);
            }
        }

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

// Admin: Get All Program Officers
app.get('/admin/all-program-officers', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    try {
        const officers = await ProgramOfficer.find({})
            .populate('collegeId', 'insName code')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            officers
        });
    } catch (error) {
        console.error("Error fetching all program officers:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Admin: Get All Students
app.get('/admin/all-students', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    try {
        const students = await Member.find({})
            .populate('collegeId', 'insName code')
            .populate('unitId', 'unitNumber name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            students
        });
    } catch (error) {
        console.error("Error fetching all students:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Get Unassigned Program Officers for a college
app.get('/unassigned-officers/:collegeCode', verifyToken, async (req, res) => {
    const { collegeCode } = req.params;
    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) return res.status(404).json({ success: false, message: "College not found" });

        // Officers with no unit assigned (unit is empty string or field missing)
        const unassignedOfficers = await ProgramOfficer.find({
            collegeId: college._id,
            $or: [{ unit: "" }, { unit: { $exists: false } }]
        });

        res.json({ success: true, officers: unassignedOfficers });
    } catch (error) {
        console.error("Error fetching unassigned officers:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Assign Program Officer to a Unit
app.post('/assign-officer-to-unit', verifyToken, async (req, res) => {
    const { officerId, unitNumber, collegeCode } = req.body;

    // Only Admin or College users can assign
    if (req.user.role !== 'admin' && req.user.role !== 'college') {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) return res.status(404).json({ success: false, message: "College not found" });

        const officer = await ProgramOfficer.findById(officerId);
        if (!officer) return res.status(404).json({ success: false, message: "Officer not found" });

        // Handle Unassignment
        if (unitNumber === "UNASSIGNED") {
            if (officer.unit) {
                // Clear the head field in the unit they were assigned to
                await Unit.findOneAndUpdate(
                    { unitNumber: officer.unit, collegeId: college._id },
                    { $set: { head: null } }
                );
            }
            officer.unit = "";
            await officer.save();
            return res.json({ success: true, message: "Officer unassigned successfully", officer });
        }

        const unit = await Unit.findOne({ unitNumber, collegeId: college._id });
        if (!unit) return res.status(404).json({ success: false, message: "Unit not found" });

        // 1. If this officer belongs to another unit already, clear that unit's head
        if (officer.unit && officer.unit !== unitNumber) {
            await Unit.findOneAndUpdate(
                { unitNumber: officer.unit, collegeId: college._id },
                { $set: { head: null } }
            );
        }

        // 2. If the target unit already has a different head, clear that officer's unit field
        if (unit.head && String(unit.head) !== String(officerId)) {
            await ProgramOfficer.findByIdAndUpdate(unit.head, { $set: { unit: "" } });
        }

        // 3. Update the officer record
        officer.unit = unitNumber;
        await officer.save();

        // 4. Update the unit record
        unit.head = officerId;
        await unit.save();

        res.json({ success: true, message: "Officer assigned successfully", officer });
    } catch (error) {
        console.error("Error assigning officer:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Adopting Villages Management
app.post('/add-village', verifyToken, async (req, res) => {
    const { username, village } = req.body;

    if (req.user.role !== 'admin' && req.user.userName !== username) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    try {
        const user = await User.findOne({ userName: username });
        if (!user) return res.status(404).json({ success: false, message: "College not found" });

        user.adoptingVillages.push(village);
        await user.save();
        res.json({ success: true, message: "Village added successfully", user: { adoptingVillages: user.adoptingVillages } });
    } catch (error) {
        console.error("Error adding village:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.delete('/delete-village', verifyToken, async (req, res) => {
    const { username, villageIndex } = req.body;

    if (req.user.role !== 'admin' && req.user.userName !== username) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    try {
        const user = await User.findOne({ userName: username });
        if (!user) return res.status(404).json({ success: false, message: "College not found" });

        user.adoptingVillages.splice(villageIndex, 1);
        await user.save();
        res.json({ success: true, message: "Village removed successfully", user: { adoptingVillages: user.adoptingVillages } });
    } catch (error) {
        console.error("Error deleting village:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});