const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmailViaBrevo } = require('../services/emailService');

// Admin registers a college shell
const addOrganization = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const { insName, code, collegeType, email } = req.body;
    
    if (!insName || !code || !collegeType) {
        return res.status(400).json({ success: false, message: "Missing required fields: insName, code, or collegeType" });
    }

    try {
        const existingCode = await User.findOne({ code });
        if (existingCode) {
            return res.status(400).json({ success: false, message: "College code already exists" });
        }

        const collegeEmail = email ? email.trim() : `temp_${code}@nss.org`;

        const newCollege = new User({
            insName,
            code,
            collegeType,
            email: collegeEmail,
            isRegistered: false,
            userName: collegeEmail,
            password: `temp_${code}`,
            collegeDetails: {
                email: collegeEmail
            }
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

// Helper function to mask email for UI feedback
const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email || "";
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2 ? name.substring(0, 2) + '****' : name + '****';
    return `${maskedName}@${domain}`;
};

// Validate college code & Send OTP for self-registration
const sendCollegeOtp = async (req, res) => {
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

        const targetEmail = college.email || college.collegeDetails?.email || college.userName;
        if (!targetEmail || targetEmail.startsWith('temp_')) {
            return res.status(400).json({
                success: false,
                message: "No college email registered by admin. Please contact administrator to initialize your college email."
            });
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        college.otp = otp;
        college.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        await college.save();

        // Send OTP email via Brevo
        try {
            await sendEmailViaBrevo({
                to: targetEmail,
                subject: `NSS Portal - Registration Verification OTP`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
                        <h2 style="color: #1e3a8a;">NSS College Registration OTP</h2>
                        <p>Dear Principal / NSS Coordinator of <strong>${college.insName}</strong>,</p>
                        <p>Your One-Time Password (OTP) for completing NSS Portal registration is:</p>
                        <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <h1 style="color: #2563eb; letter-spacing: 6px; margin: 0; font-size: 32px;">${otp}</h1>
                        </div>
                        <p>This OTP is valid for <strong>10 minutes</strong>. Please enter this code on the registration page to proceed.</p>
                        <br/>
                        <p>Best regards,<br/>NSS Cell, Periyar University</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error("Error sending OTP email:", emailErr);
        }

        res.json({
            success: true,
            message: `OTP sent to college email (${maskEmail(targetEmail)})`,
            emailMasked: maskEmail(targetEmail),
            insName: college.insName,
            collegeType: college.collegeType
        });
    } catch (error) {
        console.error("Error sending college OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Verify OTP for college sign up
const verifyCollegeOtp = async (req, res) => {
    const { code, otp } = req.body;
    if (!code || !otp) {
        return res.status(400).json({ success: false, message: "College code and OTP are required" });
    }

    try {
        const college = await User.findOne({ code });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        if (!college.otp || college.otp !== String(otp).trim()) {
            return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
        }

        if (college.otpExpiresAt && new Date() > new Date(college.otpExpiresAt)) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP." });
        }

        // BUG-08: Clear OTP immediately after successful verification (prevent reuse within expiry window)
        college.otp = "";
        college.otpExpiresAt = null;
        // BUG-07: Mark OTP as verified so registerCollege can confirm the flow was completed
        college.otpVerified = true;
        await college.save();

        res.json({
            success: true,
            message: "OTP verified successfully!",
            insName: college.insName,
            collegeType: college.collegeType,
            email: college.email || college.collegeDetails?.email || ""
        });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Validate college code for self-registration (kept for compatibility)
const validateCollegeCode = sendCollegeOtp;

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

        // BUG-07: Ensure OTP verification was actually completed before allowing registration
        if (!college.otpVerified) {
            return res.status(403).json({ success: false, message: "OTP verification is required before completing registration. Please verify your OTP first." });
        }

        // Hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update college fields
        college.userName = collegeDetails.email; // Use college email as login username
        college.password = hashedPassword;
        college.isRegistered = true;
        college.otpVerified = false; // BUG-07: Reset otpVerified flag after registration completes

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

            // BUG-15: bcrypt is one-way — bank details must NOT be hashed (they need to be readable).
            // Store as plain text for now. TODO: Replace with AES encryption if confidentiality is required.
            college.bankDetails = {
                accountNumber: rawAccountNo,
                bank: rawBankName,
                branch: rawBranch,
                ifsc: rawIfsc,
                accountHolder: rawAccountHolder
            };
        }

        await college.save();

        // Send Email via Brevo
        try {
            await sendEmailViaBrevo({
                to: collegeDetails.email,
                subject: `NSS Portal V2 - Registration Complete`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #1e3a8a;">NSS College Registration Successful</h2>
                        <p>Dear Principal & NSS Coordinator,</p>
                        <p>Your college <strong>${college.insName}</strong> (Code: ${code}) has completed V2 registration.</p>
                        <p>Below are your login credentials:</p>
                        <table style="border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Login Username:</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${collegeDetails.email}</td>
                            </tr>
                        </table>
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
            message: "College registered successfully"
        });
    } catch (error) {
        console.error("Error registering college:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Admin regenerates college passkey (Deprecated - passkey authentication disabled)
const regeneratePasskey = async (req, res) => {
    res.json({ success: true, message: "Passkeys are no longer used in the system." });
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
    sendCollegeOtp,
    verifyCollegeOtp,
    registerCollege,
    regeneratePasskey,
    getCollegeDashboard,
    addAdoptedVillage,
    deleteAdoptedVillage,
    bulkAddOrganizations
};

