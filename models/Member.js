const mongoose = require('mongoose');

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

module.exports = mongoose.model('Member', memberSchema);
