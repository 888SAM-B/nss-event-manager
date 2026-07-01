const ProgramOfficer = require('../models/ProgramOfficer');
const Unit = require('../models/Unit');
const User = require('../models/User');
const { verifyOwnership } = require('../middlewares/auth');

// Register Program Officer
const registerProgramOfficer = async (req, res) => {
    const { officerData, collegeCode } = req.body;
    try {
        if (!(await verifyOwnership(req, collegeCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access to this college" });
        }

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
};

// Update Program Officer
const updateProgramOfficer = async (req, res) => {
    const { officerData, collegeCode } = req.body;
    const { id } = req.params;
    try {
        if (!(await verifyOwnership(req, collegeCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access to this college" });
        }

        const officer = await ProgramOfficer.findById(id);
        if (!officer) return res.status(404).json({ success: false, message: "Officer not found" });

        const college = await User.findOne({ code: collegeCode });
        if (!college || String(officer.collegeId) !== String(college._id)) {
            return res.status(403).json({ success: false, message: "Forbidden: Officer does not belong to this college" });
        }

        const updatedOfficer = await ProgramOfficer.findByIdAndUpdate(id, {
            ...officerData
        }, { new: true });

        // Update Unit Head if unit changed or was assigned
        if (officerData.unit) {
            // Clear previous unit head if changed
            if (officer.unit && officer.unit !== officerData.unit) {
                await Unit.findOneAndUpdate(
                    { unitNumber: officer.unit, collegeId: officer.collegeId },
                    { head: null }
                );
            }
            // Set new unit head
            await Unit.findOneAndUpdate(
                { unitNumber: officerData.unit, collegeId: college._id },
                { head: updatedOfficer._id }
            );
        }

        res.json({ success: true, message: "Program Officer updated successfully", officer: updatedOfficer });
    } catch (error) {
        console.error("Error updating program officer:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get Program Officers for a college
const getProgramOfficers = async (req, res) => {
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
};

// Delete Program Officer
const deleteProgramOfficer = async (req, res) => {
    try {
        const { id } = req.params;
        const officer = await ProgramOfficer.findById(id);
        if (!officer) return res.status(404).json({ success: false, message: "Officer not found" });

        const college = await User.findById(officer.collegeId);
        if (!college) return res.status(404).json({ success: false, message: "College not found" });

        if (!(await verifyOwnership(req, college.code))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

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
};

// Get Unassigned Program Officers
const getUnassignedOfficers = async (req, res) => {
    const { collegeCode } = req.params;
    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) return res.status(404).json({ success: false, message: "College not found" });

        const unassignedOfficers = await ProgramOfficer.find({
            collegeId: college._id,
            $or: [{ unit: "" }, { unit: { $exists: false } }]
        });

        res.json({ success: true, officers: unassignedOfficers });
    } catch (error) {
        console.error("Error fetching unassigned officers:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Assign Officer to Unit
const assignOfficerToUnit = async (req, res) => {
    const { officerId, unitNumber, collegeCode } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'college') {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    try {
        if (!(await verifyOwnership(req, collegeCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

        const college = await User.findOne({ code: collegeCode });
        if (!college) return res.status(404).json({ success: false, message: "College not found" });

        const officer = await ProgramOfficer.findById(officerId);
        if (!officer) return res.status(404).json({ success: false, message: "Officer not found" });

        if (String(officer.collegeId) !== String(college._id)) {
            return res.status(403).json({ success: false, message: "Forbidden: Officer does not belong to this college" });
        }

        // Handle Unassignment
        if (unitNumber === "UNASSIGNED") {
            if (officer.unit) {
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

        // If this officer belongs to another unit already, clear that unit's head
        if (officer.unit && officer.unit !== unitNumber) {
            await Unit.findOneAndUpdate(
                { unitNumber: officer.unit, collegeId: college._id },
                { $set: { head: null } }
            );
        }

        // If the target unit already has a different head, clear that officer's unit field
        if (unit.head && String(unit.head) !== String(officerId)) {
            await ProgramOfficer.findByIdAndUpdate(unit.head, { $set: { unit: "" } });
        }

        // Update the officer record
        officer.unit = unitNumber;
        await officer.save();

        // Update the unit record
        unit.head = officerId;
        await unit.save();

        res.json({ success: true, message: "Officer assigned successfully", officer });
    } catch (error) {
        console.error("Error assigning officer:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Admin: Get All Program Officers
const getAllProgramOfficers = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'nodal') {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    try {
        let officers;
        if (req.user.role === 'nodal') {
            // Find colleges in the nodal officer's district
            const collegesInDistrict = await User.find({
                $or: [
                    { 'collegeLocation.district': { $regex: new RegExp(`^${req.user.district}$`, 'i') } },
                    { 'district': { $regex: new RegExp(`^${req.user.district}$`, 'i') } }
                ]
            });
            const collegeIds = collegesInDistrict.map(c => c._id);
            officers = await ProgramOfficer.find({ collegeId: { $in: collegeIds } }).populate('collegeId', 'insName code');
        } else {
            officers = await ProgramOfficer.find().populate('collegeId', 'insName code');
        }
        res.json({ success: true, officers });
    } catch (error) {
        console.error("Error fetching all program officers:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    registerProgramOfficer,
    updateProgramOfficer,
    getProgramOfficers,
    deleteProgramOfficer,
    getUnassignedOfficers,
    assignOfficerToUnit,
    getAllProgramOfficers
};
