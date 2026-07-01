const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Unit = require('../models/Unit');
const NodalOfficer = require('../models/NodalOfficer');
const { comparePassword } = require('../utils/auth');

// College/User Login
const loginCollege = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ userName: username });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        // Must be fully registered
        if (!user.isRegistered) {
            return res.status(403).json({ success: false, message: "College registration is not completed. Please complete registration first." });
        }

        const isMatch = await comparePassword(password, user.password, user);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        const token = jwt.sign(
            { userName: username, userId: user._id, role: 'college' },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Unit Login
const loginUnit = async (req, res) => {
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

        const token = jwt.sign(
            { unitNumber: unitCode, role: 'unit' },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Admin Login
const loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { role: 'admin', username: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Invalid Admin Credentials" });
    }
};

// District Nodal Officer Login
const loginNodal = async (req, res) => {
    const { email, password } = req.body;
    try {
        const nodal = await NodalOfficer.findOne({ email });
        if (!nodal) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, nodal.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { nodalId: nodal._id, email: nodal.email, district: nodal.district, role: 'nodal' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.json({ success: true, token, district: nodal.district, name: nodal.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    loginCollege,
    loginUnit,
    loginAdmin,
    loginNodal
};
