const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Member = require('../models/Member');
const ProgramOfficer = require('../models/ProgramOfficer');
const { verifyOwnership } = require('../middlewares/auth');
const { sendEmailViaBrevo } = require('../services/emailService');
const { encryptBankDetails, decryptBankDetails } = require('../utils/encryption');

// Create a new NSS Unit (uses College Code verification & auto unit number generation)
const addUnit = async (req, res) => {
    const { collegeCode, name, password, createdDate, unitType, category, officerData, bankDetails } = req.body;

    if (!collegeCode || !name || !password) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!officerData && (!req.body.poMode || req.body.poMode !== 'existing')) {
        if (!officerData || !officerData.name || !officerData.designation || !officerData.department || !officerData.email || !officerData.mobile) {
            return res.status(400).json({ success: false, message: "Missing required Program Officer details (Name, Designation, Department, Email, Mobile are mandatory)" });
        }
    }

    // BUG-21: Verify ownership — only admin or the college itself can add units
    if (!(await verifyOwnership(req, collegeCode))) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
    }

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // BUG-24: Use accurate DB count instead of stale college.units.length for max check
        const actualUnitCount = await Unit.countDocuments({ collegeId: college._id });
        if (actualUnitCount >= 6) {
            return res.status(400).json({ success: false, message: "Maximum 6 units allowed for this college" });
        }

        // BUG-09: Use historical DB count (not college.units.length) to avoid reuse after unit deletion
        const sequence = String(actualUnitCount + 1).padStart(2, '0');
        const unitNumber = `NSS-${collegeCode}-${sequence}`;

        // Check if unitNumber already exists (edge case: deleted unit, then DB count could still collide)
        const existingUnit = await Unit.findOne({ unitNumber });
        if (existingUnit) {
            // Find the next available sequence by checking all existing numbers
            const existingNumbers = await Unit.find({ collegeId: college._id }, 'unitNumber');
            const usedSeqs = existingNumbers.map(u => parseInt(u.unitNumber.split('-').pop())).filter(n => !isNaN(n));
            let nextSeq = 1;
            while (usedSeqs.includes(nextSeq)) nextSeq++;
            const safeSequence = String(nextSeq).padStart(2, '0');
            const safeUnitNumber = `NSS-${collegeCode}-${safeSequence}`;
            // Use safe unit number
            Object.assign(req.body, { _safeUnitNumber: safeUnitNumber });
        }

        const finalUnitNumber = req.body._safeUnitNumber || unitNumber;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUnit = new Unit({
            name,
            password: hashedPassword,
            members: [],
            unitNumber: finalUnitNumber,
            unitType: unitType || category || 'Funded',
            createdDate: createdDate || new Date().toISOString().split('T')[0],
            collegeId: college._id,
            bankDetails: bankDetails ? encryptBankDetails(bankDetails) : {}
        });

        await newUnit.save();

        let officerIdToLink;
        const { poMode, existingOfficerId, assignmentMode } = req.body;

        if (poMode === 'existing' && existingOfficerId) {
            const existingOfficer = await ProgramOfficer.findById(existingOfficerId);
            if (!existingOfficer) {
                return res.status(404).json({ success: false, message: "Selected Program Officer not found" });
            }
            if (String(existingOfficer.collegeId) !== String(college._id)) {
                return res.status(403).json({ success: false, message: "Selected Officer does not belong to this college" });
            }

            officerIdToLink = existingOfficer._id;

            const oldUnitNumber = existingOfficer.unit ? existingOfficer.unit.trim() : "";
            if (oldUnitNumber && oldUnitNumber !== "") {
                if (assignmentMode === 'transfer') {
                    // Option 1: Exit from previous unit and join new unit
                    await Unit.findOneAndUpdate(
                        { unitNumber: oldUnitNumber, collegeId: college._id },
                        { $set: { head: null } }
                    );
                    existingOfficer.unit = finalUnitNumber;
                } else {
                    // Option 2: Dual Charge — assign to both units
                    if (!existingOfficer.unit.includes(finalUnitNumber)) {
                        existingOfficer.unit = `${existingOfficer.unit}, ${finalUnitNumber}`;
                    }
                }
            } else {
                // Officer was unassigned
                existingOfficer.unit = finalUnitNumber;
            }
            await existingOfficer.save();
        } else {
            // Default: Create New Program Officer
            if (!officerData || !officerData.name || !officerData.designation || !officerData.department || !officerData.email || !officerData.mobile) {
                return res.status(400).json({ success: false, message: "Missing required Program Officer details (Name, Designation, Department, Email, Mobile are mandatory)" });
            }

            const officerCount = await ProgramOfficer.countDocuments({ collegeId: college._id });
            const officerID = `NSSPO${college.code}${String(officerCount + 1).padStart(2, '0')}`;

            const newOfficer = new ProgramOfficer({
                ...officerData,
                unit: finalUnitNumber,
                college: college.insName,
                collegeId: college._id,
                officerID
            });

            await newOfficer.save();
            officerIdToLink = newOfficer._id;
        }

        // Link Program Officer as the unit head
        newUnit.head = officerIdToLink;
        await newUnit.save();

        college.units.push(newUnit._id);
        await college.save();

        const populatedUnit = await Unit.findById(newUnit._id).populate('members').populate('head');

        res.json({
            success: true,
            message: "Unit and Program Officer assigned successfully",
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

        const unitObj = unit.toObject();
        unitObj.bankDetails = decryptBankDetails(unitObj.bankDetails);

        res.json({ success: true, unit: unitObj, college: collegeObject });
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

        // BUG-14: Whitelist safe fields only — prevent unitId/collegeId from being overwritten via request body
        const safeFields = [
            'name', 'regNo', 'dept', 'course', 'community', 'contact', 'bloodGroup',
            'dob', 'batchFrom', 'batchTo', 'fatherName', 'fatherPhone', 'sex', 'height',
            'weight', 'aadhaar', 'enrolmentDate', 'culturalTalents', 'hobbies', 'address',
            'enrolmentNo', 'remarks', 'universityName', 'email', 'isEnrolled'
        ];
        const safeUpdateData = {};
        safeFields.forEach(field => {
            if (memberData[field] !== undefined) safeUpdateData[field] = memberData[field];
        });

        const updatedMember = await Member.findByIdAndUpdate(memberId, safeUpdateData, { new: true });
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

        // BUG-13: Scope delete to only members that belong to this specific unit — prevent cross-unit deletion
        await Member.deleteMany({ _id: { $in: memberIds }, unitId: unit._id });
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

// Send OTP to Programme Officer's Email for updating unit bank details
const sendUnitBankOtp = async (req, res) => {
    const { unitCode, collegeCode } = req.body;

    if (!unitCode || !collegeCode) {
        return res.status(400).json({ success: false, message: "Missing unit code or college code" });
    }

    try {
        if (!(await verifyOwnership(req, collegeCode, unitCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id }).populate('head');
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        // Get PO email
        const targetEmail = unit.head?.email || unit.mail;
        if (!targetEmail || !targetEmail.includes('@')) {
            return res.status(400).json({
                success: false,
                message: "No Programme Officer email registered for this unit to send OTP."
            });
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        unit.bankOtp = otp;
        unit.bankOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        await unit.save();

        // Send Email via Brevo
        try {
            await sendEmailViaBrevo({
                to: targetEmail,
                subject: `NSS Portal - Verification OTP to Edit Unit Bank Details`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                        <h2 style="color: #1e3a8a;">NSS Unit Bank Details Edit Verification</h2>
                        <p>Dear <strong>${unit.head?.name || 'Programme Officer'}</strong> (${unit.unitNumber}),</p>
                        <p>A request was submitted to edit/update the official <strong>ZBSCA & Vendor Bank Account Details</strong> for NSS Unit <strong>${unit.unitNumber}</strong> (${college.insName}).</p>
                        <p>Your One-Time Verification OTP is:</p>
                        <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <h1 style="color: #2563eb; letter-spacing: 6px; margin: 0; font-size: 32px;">${otp}</h1>
                        </div>
                        <p>This OTP is valid for <strong>10 minutes</strong>. If you did not request this update, please report to your administrator immediately.</p>
                        <br/>
                        <p>Best regards,<br/>NSS Cell, Periyar University</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error("Error sending unit bank OTP email:", emailErr);
        }

        const maskEmailStr = (email) => {
            if (!email || !email.includes('@')) return email || '';
            const [name, domain] = email.split('@');
            if (name.length <= 2) return `${name}***@${domain}`;
            return `${name.substring(0, 2)}***${name.slice(-1)}@${domain}`;
        };

        res.json({
            success: true,
            message: `OTP sent to Programme Officer email (${maskEmailStr(targetEmail)})`,
            emailMasked: maskEmailStr(targetEmail)
        });
    } catch (error) {
        console.error("Error sending unit bank OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Update unit bank details after OTP verification
const updateUnitBankDetails = async (req, res) => {
    const { unitCode, collegeCode, otp, bankDetails } = req.body;

    if (!unitCode || !collegeCode || !otp || !bankDetails) {
        return res.status(400).json({ success: false, message: "Missing required fields or OTP" });
    }

    try {
        if (!(await verifyOwnership(req, collegeCode, unitCode))) {
            return res.status(403).json({ success: false, message: "Forbidden: Unauthorized access" });
        }

        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: college._id });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        // Verify OTP
        if (!unit.bankOtp || unit.bankOtp !== String(otp).trim()) {
            return res.status(400).json({ success: false, message: "Invalid OTP code" });
        }

        if (unit.bankOtpExpiresAt && new Date() > new Date(unit.bankOtpExpiresAt)) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        // Update bank details (encrypted) and reset OTP
        unit.bankDetails = encryptBankDetails(bankDetails);
        unit.bankOtp = "";
        unit.bankOtpExpiresAt = null;
        await unit.save();

        res.json({
            success: true,
            message: "Unit bank account details updated successfully!",
            bankDetails: decryptBankDetails(unit.bankDetails)
        });
    } catch (error) {
        console.error("Error updating unit bank details:", error);
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
    deleteUnitMember,
    sendUnitBankOtp,
    updateUnitBankDetails
};
