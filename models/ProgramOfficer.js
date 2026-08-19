const mongoose = require('mongoose');

const programOfficerSchema = new mongoose.Schema({
    // Main Details
    name: String,
    designation: String,
    department: String,
    unit: String,
    college: String,

    // Personal Details
    image: String, // Path or Base64
    dob: String,
    gender: String,
    community: String, // SC/ST/OBC/General
    email: String,
    mobile: String,
    address: String,
    block: String,
    taluk: String,
    district: String,
    pincode: String,
    dateOfAppointment: String,
    teachingExperience: String,

    // Academic
    qualification: String,
    seminars: [String],
    etiCompleted: String, // Yes/No

    // General
    nssExperience: [String],
    specialTalent: [String],

    // V2 Fields
    achievements: { type: String, default: "" }, // Renamed from Previous Experience
    etlTraining: { type: Boolean, default: false }, // Yes/No -> stored as boolean
    etlCertificate: { type: String, default: "" }, // Path to the uploaded document (Multer)

    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    officerID: { type: String, unique: true, sparse: true }, // BUG-06: unique constraint prevents duplicate IDs from race conditions
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProgramOfficer', programOfficerSchema);
