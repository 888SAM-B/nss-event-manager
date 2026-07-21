const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmailViaBrevo } = require('../services/emailService');

// Admin registers a college shell
const addOrganization = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const { insName, code, collegeType } = req.body;
    
    if (!insName || !code || !collegeType) {
        return res.status(400).json({ success: false, message: "Missing required fields: insName, code, or collegeType" });
    }

    try {
        const existingCode = await User.findOne({ code });
        if (existingCode) {
            return res.status(400).json({ success: false, message: "College code already exists" });
        }

        const newCollege = new User({
            insName,
            code,
            collegeType,
            isRegistered: false,
            // placeholders
            userName: `temp_${code}@nss.org`,
            password: `temp_${code}`
        });

        await newCollege.save();
        res.json({
            success: true,
            message: "College shell registered successfully. Completion required by college.",
            college: newCollege
        });
    } catch (error) {
        console.error("Error adding organization:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Validate college code for self-registration
const validateCollegeCode = async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ success: false, message: "College code is required" });
    }

    try {
        const college = await User.findOne({ code });
        if (!college) {
            return res.status(404).json({ success: false, message: "Invalid college code. Not found in system shell registration." });
        }

        if (college.isRegistered) {
            return res.status(400).json({
                success: false,
                message: "This college has already completed registration.",
                alreadyRegistered: true
            });
        }

        res.json({
            success: true,
            insName: college.insName,
            collegeType: college.collegeType
        });
    } catch (error) {
        console.error("Error validating college code:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Complete college self-registration
const registerCollege = async (req, res) => {
    const {
        code,
        password,
        principalDetails,
        collegeDetails,
        collegeLocation,
        bankDetails
    } = req.body;

    if (!code || !password || !principalDetails || !collegeDetails || !collegeLocation) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const college = await User.findOne({ code });
        if (!college) {
            return res.status(404).json({ success: false, message: "College code not found" });
        }
        if (college.isRegistered) {
            return res.status(400).json({ success: false, message: "This college is already registered" });
        }

        // Generate cryptographically secure passkey
        const rawSuffix = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
        const plainPasskey = `NSS-PU26-${rawSuffix}`;

        // Hashing passkey and password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const hashedPasskey = await bcrypt.hash(plainPasskey, salt);

        // Update college fields
        college.userName = collegeDetails.email; // Use college email as login username
        college.password = hashedPassword;
        college.passkey = hashedPasskey;
        college.isRegistered = true;

        college.principalDetails = principalDetails;
        college.collegeDetails = collegeDetails;
        college.collegeLocation = collegeLocation;

        // Legacy fields mapping for backward compatibility
        college.district = collegeLocation.district;
        college.pincode = collegeLocation.pincode;
        college.location = collegeLocation.address;

        if (college.collegeType === 'Funded' && bankDetails) {
            const rawAccountNo = bankDetails.accountNo || bankDetails.accountNumber || "";
            const rawBankName = bankDetails.bankName || bankDetails.bank || "";
            const rawBranch = bankDetails.branch || "";
            const rawIfsc = bankDetails.ifsc || "";
            const rawAccountHolder = bankDetails.accountHolder || "";

            college.bankDetails = {
                accountNumber: rawAccountNo ? await bcrypt.hash(rawAccountNo, salt) : "",
                bank: rawBankName ? await bcrypt.hash(rawBankName, salt) : "",
                branch: rawBranch ? await bcrypt.hash(rawBranch, salt) : "",
                ifsc: rawIfsc ? await bcrypt.hash(rawIfsc, salt) : "",
                accountHolder: rawAccountHolder ? await bcrypt.hash(rawAccountHolder, salt) : ""
            };
        }

        await college.save();

        // Send Email via Brevo
        try {
            await sendEmailViaBrevo({
                to: collegeDetails.email,
                subject: `NSS Portal V2 - Registration Complete & Passkey`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #1e3a8a;">NSS College Registration Successful</h2>
                        <p>Dear Principal & NSS Coordinator,</p>
                        <p>Your college <strong>${college.insName}</strong> (Code: ${code}) has completed V2 registration.</p>
                        <p>Below are your credentials and secure passkey for creating/joining NSS Units:</p>
                        <table style="border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Login Username:</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${collegeDetails.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">NSS Secure Passkey:</td>
                                <td style="padding: 8px; border: 1px solid #ddd; color: #b91c1c; font-size: 1.1em; font-weight: bold;">${plainPasskey}</td>
                            </tr>
                        </table>
                        <p style="color: #ef4444; font-weight: bold;">IMPORTANT: Never share this passkey. You will need this passkey whenever you create a new NSS Unit or assign unit-level access.</p>
                        <br/>
                        <p>Best regards,</p>
                        <p>NSS Cell, Periyar University</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send registration email:", emailError.message);
        }

        res.json({
            success: true,
            message: "College registered successfully",
            passkey: plainPasskey
        });
    } catch (error) {
        console.error("Error registering college:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Admin regenerates college passkey
const regeneratePasskey = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ success: false, message: "College code is required" });
    }

    try {
        const college = await User.findOne({ code });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // Generate new passkey
        const rawSuffix = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
        const plainPasskey = `NSS-PU26-${rawSuffix}`;

        const salt = await bcrypt.genSalt(10);
        const hashedPasskey = await bcrypt.hash(plainPasskey, salt);

        college.passkey = hashedPasskey;
        await college.save();

        // Send Email via Brevo
        try {
            await sendEmailViaBrevo({
                to: college.collegeDetails?.email || college.userName,
                subject: `NSS Portal V2 - Regulated Passkey Regenerated`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #1e3a8a;">NSS Secure Passkey Regenerated</h2>
                        <p>Dear Principal & NSS Coordinator,</p>
                        <p>An administrator has regenerated the NSS secure passkey for your institution <strong>${college.insName}</strong>.</p>
                        <p>The previous passkey is now immediately **invalidated**.</p>
                        <p>Your new secure passkey is: <strong style="color: #b91c1c; font-size: 1.2em;">${plainPasskey}</strong></p>
                        <br/>
                        <p>Best regards,</p>
                        <p>NSS Cell, Periyar University</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send passkey regeneration email:", emailError.message);
        }

        res.json({
            success: true,
            message: "Passkey regenerated and emailed successfully",
            passkey: plainPasskey
        });
    } catch (error) {
        console.error("Error regenerating passkey:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get College Dashboard details
const getCollegeDashboard = async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    try {
        const college = await User.findOne({ userName: username });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // Security check
        if (req.user.role !== 'admin' && req.user.role !== 'nodal' && req.user.userName !== username) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        // If nodal, verify district matches
        if (req.user.role === 'nodal') {
            const district = college.collegeLocation?.district || college.district || "";
            if (req.user.district.toLowerCase() !== district.toLowerCase()) {
                return res.status(403).json({ success: false, message: "Unauthorized: College district does not match assigned district" });
            }
        }

        const populatedCollege = await User.findOne({ userName: username }).populate({
            path: 'units',
            populate: { path: 'head' }
        });

        res.json({
            success: true,
            user: populatedCollege
        });
    } catch (error) {
        console.error("Error getting dashboard:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Add adopted village with distance validation
const addAdoptedVillage = async (req, res) => {
    const { collegeCode, name, address, block, taluk, district, pincode, distance } = req.body;

    if (!collegeCode || !name || !address || distance === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const numericDistance = Number(distance);
    if (numericDistance > 7) {
        return res.status(400).json({ success: false, message: "Distance exceeds the maximum limit of 7 KM" });
    }

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // Security check
        const { verifyOwnership } = require('../middlewares/auth');
        if (!(await verifyOwnership(req, collegeCode))) {
            return res.status(403).json({ success: false, message: "Unauthorized: only college admin or associated unit can add villages" });
        }

        college.adoptingVillages.push({
            name,
            address,
            block: block || "",
            taluk: taluk || "",
            district: district || "",
            pincode: pincode || "",
            distance: numericDistance
        });

        await college.save();
        res.json({ success: true, message: "Adopted village registered successfully", adoptingVillages: college.adoptingVillages });
    } catch (error) {
        console.error("Error adding adopted village:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteAdoptedVillage = async (req, res) => {
    const { collegeCode, villageIndex } = req.body;

    if (!collegeCode || villageIndex === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const college = await User.findOne({ code: collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        // Security check
        const { verifyOwnership } = require('../middlewares/auth');
        if (!(await verifyOwnership(req, collegeCode))) {
            return res.status(403).json({ success: false, message: "Unauthorized: only college admin or associated unit can delete villages" });
        }

        const index = Number(villageIndex);
        if (index < 0 || index >= college.adoptingVillages.length) {
            return res.status(400).json({ success: false, message: "Invalid village index" });
        }

        college.adoptingVillages.splice(index, 1);
        await college.save();

        res.json({ success: true, message: "Adopted village removed successfully", adoptingVillages: college.adoptingVillages });
    } catch (error) {
        console.error("Error deleting adopted village:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const bulkAddOrganizations = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const { colleges } = req.body;
    if (!colleges || !Array.isArray(colleges) || colleges.length === 0) {
        return res.status(400).json({ success: false, message: "Missing or invalid colleges data" });
    }

    try {
        let successCount = 0;
        let duplicateCount = 0;
        const savedColleges = [];
        const duplicates = [];

        for (const col of colleges) {
            const { insName, code, collegeType } = col;
            if (!insName || !code || !collegeType) {
                continue; // Skip invalid rows
            }

            const existing = await User.findOne({ code });
            if (existing) {
                duplicateCount++;
                duplicates.push(code);
                continue;
            }

            // Normalise collegeType to match the schema ENUM: 'Funded', 'Self-Financed', or 'Self-Financing'
            let normalizedType = 'Self-Financing';
            if (collegeType.toLowerCase().includes('funded')) {
                normalizedType = 'Funded';
            } else if (collegeType.toLowerCase().includes('financed')) {
                normalizedType = 'Self-Financing';
            }

            const newCollege = new User({
                insName,
                code,
                collegeType: normalizedType,
                isRegistered: false,
                userName: `temp_${code}@nss.org`,
                password: `temp_${code}`
            });

            await newCollege.save();
            savedColleges.push(newCollege);
            successCount++;
        }

        res.json({
            success: true,
            message: `Bulk registration completed. Succeeded: ${successCount}, Duplicates skipped: ${duplicateCount}`,
            successCount,
            duplicateCount,
            duplicates
        });
    } catch (error) {
        console.error("Error bulk adding organizations:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    addOrganization,
    validateCollegeCode,
    registerCollege,
    regeneratePasskey,
    getCollegeDashboard,
    addAdoptedVillage,
    deleteAdoptedVillage,
    bulkAddOrganizations
};

