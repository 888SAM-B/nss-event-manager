const mongoose = require('mongoose');

const insLoginScheme = new mongoose.Schema({
    userName: { type: String, default: "" }, // Will store College Email for completed registrations
    password: { type: String, default: "" }, // Hashed password
    insName: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    collegeType: { type: String, enum: ['Funded', 'Self-Financed', 'Self-Financing', 'Funded & Self-Financing', 'Funded + Self-Financing'], default: 'Self-Financing' },
    isRegistered: { type: Boolean, default: false },
    passkey: { type: String, default: "" }, // Hashed passkey
    email: { type: String, default: "" }, // College Email initialized by admin
    otp: { type: String, default: "" }, // OTP for registration verification
    otpExpiresAt: { type: Date },
    otpVerified: { type: Boolean, default: false }, // BUG-07 fix: set true after OTP verified, cleared after registration

    // Legacy fields for backward compatibility
    location: { type: String, default: "" },
    block: { type: String, default: "" },
    taluk: { type: String, default: "" },
    district: { type: String, default: "" },
    pincode: { type: String, default: "" },
    universityName: { type: String, default: "Periyar University" },
    events: { type: Array, default: [] },
    units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],

    // V2 Details
    principalDetails: {
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        mobile: { type: String, default: "" }
    },
    collegeDetails: {
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        website: { type: String, default: "" }
    },
    collegeLocation: {
        address: { type: String, default: "" },
        district: { type: String, default: "" },
        taluk: { type: String, default: "" },
        panchayat: { type: String, default: "" },
        villageTown: { type: String, default: "" },
        nearbyPoliceStation: { type: String, default: "" },
        pincode: { type: String, default: "" }
    },
    bankDetails: {
        accountHolder: { type: String, default: "" },
        bank: { type: String, default: "" },
        branch: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifsc: { type: String, default: "" }
    },
    adoptingVillages: [{
        name: String,
        address: String,
        block: String,
        taluk: String,
        district: String,
        pincode: String,
        distance: { type: Number, default: 0 } // Distance in KM
    }]
});

module.exports = mongoose.model('User', insLoginScheme);
