const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Unit = require('../models/Unit');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid token." });
    }
};

const verifyOwnership = async (req, collegeCode, unitCode = null) => {
    // Admin has full access
    if (req.user.role === 'admin') {
        return true;
    }

    // Nodal Officer authorization scoped by District
    if (req.user.role === 'nodal') {
        const college = await User.findOne({ code: collegeCode });
        if (!college) return false;
        
        const collegeDistrict = college.collegeLocation?.district || college.district || "";
        return req.user.district.toLowerCase() === collegeDistrict.toLowerCase();
    }

    // College role authorization
    if (req.user.role === 'college') {
        const college = await User.findOne({ code: collegeCode });
        if (!college) return false;
        return req.user.userName === college.userName;
    }

    // Unit role authorization
    if (req.user.role === 'unit') {
        if (unitCode && req.user.unitNumber !== unitCode) {
            return false;
        }
        const college = await User.findOne({ code: collegeCode });
        if (!college) return false;
        const unit = await Unit.findOne({ unitNumber: req.user.unitNumber, collegeId: college._id });
        if (!unit) return false;

        return true;
    }

    return false;
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Unauthorized role access." });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    verifyOwnership,
    verifyRole
};
