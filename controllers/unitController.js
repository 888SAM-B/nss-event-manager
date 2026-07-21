const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Member = require('../models/Member');
const ProgramOfficer = require('../models/ProgramOfficer');
const { verifyOwnership } = require('../middlewares/auth');

// Create a new NSS Unit (uses College Code verification & auto unit number generation)
const addUnit = async (req, res) => {
    const { collegeCode, name, password, createdDate, officerData } = req.body;

    if (!collegeCode || !name || !password) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!officerData || !officerData.name || !officerData.designation || !officerData.department || !officerData.email || !officerData.mobile) {
        return res.status(400).json({ success: false, message: "Missing required Program Officer details (Name, Designation, Department, Email, Mobile are mandatory)" });
    }

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // Maximum units check (max 6)
        if (college.units.length >= 6) {
            return res.status(400).json({ success: false, message: "Maximum 6 units allowed for this college" });
        }

        // Generate unit number: NSS + CollegeCode + Sequence (e.g. NSS5071)
        const sequence = college.units.length + 1;
        const unitNumber = `NSS${collegeCode}${sequence}`;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUnit = new Unit({
            name,
            password: hashedPassword,
            members: [],
            unitNumber,
            createdDate: createdDate || new Date().toISOString().split('T')[0],
            collegeId: college._id
        });

        await newUnit.save();

        // Create the Program Officer
        const officerCount = await ProgramOfficer.countDocuments({ collegeId: college._id });
        const officerID = `NSSPO${college.code}${String(officerCount + 1).padStart(2, '0')}`;

        const newOfficer = new ProgramOfficer({
            ...officerData,
            unit: unitNumber, // Set unit to the new unit number
            college: college.insName, // Set college name
            collegeId: college._id,
            officerID
        });

        await newOfficer.save();

        // Link Program Officer as the unit head
        newUnit.head = newOfficer._id;
        await newUnit.save();

        college.units.push(newUnit._id);
        await college.save();

        const populatedUnit = await Unit.findById(newUnit._id).populate('members').populate('head');

        res.json({
            success: true,
            message: "Unit and Program Officer created successfully",
            unit: populatedUnit
        });
    } catch (error) {
        console.error("Error adding unit:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Delete Unit
const deleteUnit = async (req, res) => {
    const { username, unitNumber } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Only administrators can delete units." });
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

        // Clean up members of this unit
        await Member.deleteMany({ unitId: unit._id });

        // Unassign program officer from this unit
        await ProgramOfficer.updateMany({ unit: unitNumber, collegeId: user._id }, { unit: "" });

        // Delete unit
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
};


// Get Units for a college (useful for dropdowns)
const getUnits = async (req, res) => {
    const { collegeCode } = req.params;
    try {
        if (!(await verifyOwnership(req, collegeCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

        const college = await User.findOne({ code: collegeCode }).populate('units', 'unitNumber name _id');
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        res.json({ success: true, units: college.units });
    } catch (error) {
        console.error("Error fetching units:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Unit Dashboard details
const getUnitDashboard = async (req, res) => {
    const { unitCode, collegeCode } = req.params;

    if (req.user.unitNumber && req.user.unitNumber !== unitCode) {
        return res.status(403).json({ success: false, message: "Unauthorized unit access" });
    }

    try {
        const collegeObject = await User.findOne({ code: collegeCode });
        if (!collegeObject) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // Check Auth
        if (req.user.role === 'college') {
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
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        res.json({ success: true, unit, college: collegeObject });
    } catch (error) {
        console.error("Error fetching unit dashboard:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// College Members list
const getCollegeMembers = async (req, res) => {
    const { collegeCode } = req.params;

    try {
        if (!(await verifyOwnership(req, collegeCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

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
};

// Update Member details
const updateUnitMember = async (req, res) => {
    const { memberId, memberData } = req.body;

    try {
        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        const college = await User.findById(member.collegeId);
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        const unit = await Unit.findById(member.unitId);
        const unitCode = unit ? unit.unitNumber : null;

        if (!(await verifyOwnership(req, college.code, unitCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

        const updatedMember = await Member.findByIdAndUpdate(memberId, memberData, { new: true });
        res.json({ success: true, message: "Member updated successfully", member: updatedMember });
    } catch (error) {
        console.error("Error updating member:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Bulk delete members
const bulkDeleteMembers = async (req, res) => {
    const { unitCode, memberIds, collegeCode } = req.body;

    if (!(await verifyOwnership(req, collegeCode, unitCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const collegeObject = await User.findOne({ code: collegeCode });
        if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });
        const collegeId = collegeObject._id;

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
};

// Bulk add members
const bulkAddMembers = async (req, res) => {
    const { unitCode, collegeCode, members } = req.body;

    if (!(await verifyOwnership(req, collegeCode, unitCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const user = await User.findOne({ code: collegeCode });
        if (!user) return res.status(404).json({ success: false, message: "College not found" });

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
};

// Add single member
const addUnitMember = async (req, res) => {
    const { unitCode, member, collegeCode } = req.body;

    if (!(await verifyOwnership(req, collegeCode, unitCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const collegeObject = await User.findOne({ code: collegeCode });
        if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });
        const collegeId = collegeObject._id;

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
};

// Delete single member
const deleteUnitMember = async (req, res) => {
    const { unitCode, memberId, collegeCode } = req.body;

    if (!(await verifyOwnership(req, collegeCode, unitCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const collegeObject = await User.findOne({ code: collegeCode });
        if (!collegeObject) return res.status(404).json({ success: false, message: "College not found" });
        const collegeId = collegeObject._id;

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
};

module.exports = {
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
};
