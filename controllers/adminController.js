const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Member = require('../models/Member');
const Event = require('../models/Event');
const ProgramOfficer = require('../models/ProgramOfficer');
const GalleryImage = require('../models/GalleryImage');
const NodalOfficer = require('../models/NodalOfficer');
const AdminHead = require('../models/AdminHead');

// Get District Helper for Nodal/Admin filtering
const getDistrictCollegeIds = async (user) => {
    if (user.role === 'admin') {
        return null; // Admin accesses all
    }
    // Nodal Officer
    const collegesInDistrict = await User.find({
        $or: [
            { 'collegeLocation.district': { $regex: new RegExp(`^${user.district}$`, 'i') } },
            { 'district': { $regex: new RegExp(`^${user.district}$`, 'i') } }
        ]
    });
    return collegesInDistrict.map(c => c._id);
};

// Admin/Nodal dashboard statistics
const getAdminStats = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'nodal') {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    try {
        const collegeIds = await getDistrictCollegeIds(req.user);
        
        let totalColleges, totalUnits, totalEvents, colleges, allEvents, eventsByCategory;

        if (collegeIds !== null) {
            // Nodal Filtered
            totalColleges = collegeIds.length;
            totalUnits = await Unit.countDocuments({ collegeId: { $in: collegeIds } });
            totalEvents = await Event.countDocuments({ collegeId: { $in: collegeIds } });
            
            eventsByCategory = await Event.aggregate([
                { $match: { collegeId: { $in: collegeIds } } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]);

            allEvents = await Event.find({ collegeId: { $in: collegeIds } }, 'name date dateFrom dateTo singleDay category eventCode')
                .populate('collegeId', 'insName code')
                .populate('unitId', 'name unitNumber');

            colleges = await User.find({ _id: { $in: collegeIds } }, 'insName code events userName')
                .populate('units', 'unitNumber name');
        } else {
            // Admin Full
            totalColleges = await User.countDocuments();
            totalUnits = await Unit.countDocuments();
            totalEvents = await Event.countDocuments();

            eventsByCategory = await Event.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]);

            allEvents = await Event.find({}, 'name date dateFrom dateTo singleDay category eventCode')
                .populate('collegeId', 'insName code')
                .populate('unitId', 'name unitNumber');

            colleges = await User.find({}, 'insName code events userName')
                .populate('units', 'unitNumber name');
        }

        res.json({
            success: true,
            stats: {
                totalColleges,
                totalUnits,
                totalEvents,
                eventsByCategory,
                colleges,
                allEvents
            }
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Admin/Nodal List Events
const getAdminEvents = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'nodal') {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    try {
        const collegeIds = await getDistrictCollegeIds(req.user);
        const filter = collegeIds ? { collegeId: { $in: collegeIds } } : {};

        const events = await Event.find(filter)
            .populate('collegeId', 'insName code')
            .populate('unitId', 'name unitNumber head')
            .sort({ createdAt: -1 });

        res.json({ success: true, events });
    } catch (error) {
        console.error("Error fetching admin events:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Admin/Nodal List Students
const getAdminStudents = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'nodal') {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    try {
        const collegeIds = await getDistrictCollegeIds(req.user);
        const filter = collegeIds ? { collegeId: { $in: collegeIds } } : {};

        const students = await Member.find(filter)
            .populate('collegeId', 'insName code')
            .populate('unitId', 'unitNumber name')
            .sort({ createdAt: -1 });

        res.json({ success: true, students });
    } catch (error) {
        console.error("Error fetching all students:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Admin Delete College and associated data
const deleteOrganization = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const { collegeId, adminUsername, adminPassword } = req.body;

    if (!collegeId || !adminUsername || !adminPassword) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (adminUsername !== process.env.ADMIN_USERNAME || adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: "Invalid Admin Credentials" });
    }

    try {
        await Member.deleteMany({ collegeId });
        await Event.deleteMany({ collegeId });
        await Unit.deleteMany({ collegeId });
        await ProgramOfficer.deleteMany({ collegeId });
        await User.findByIdAndDelete(collegeId);

        res.json({ success: true, message: "Organization and all associated data deleted successfully" });
    } catch (error) {
        console.error("Error deleting organization:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// --- Nodal Officers CRUD (Admin Only) ---

const createNodalOfficer = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const { name, email, mobile, password, district } = req.body;
    if (!name || !email || !mobile || !password || !district) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const existing = await NodalOfficer.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: "Email already registered for a Nodal Officer" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newNodal = new NodalOfficer({
            name,
            email,
            mobile,
            password: hashedPassword,
            district
        });

        await newNodal.save();
        res.json({ success: true, message: "Nodal Officer created successfully", nodal: newNodal });
    } catch (error) {
        console.error("Error creating nodal officer:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getNodalOfficers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    try {
        const nodals = await NodalOfficer.find({}).sort({ createdAt: -1 });
        res.json({ success: true, nodals });
    } catch (error) {
        console.error("Error getting nodal officers:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateNodalOfficer = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { id } = req.params;
    const { name, email, mobile, district, password } = req.body;

    try {
        const nodal = await NodalOfficer.findById(id);
        if (!nodal) return res.status(404).json({ success: false, message: "Nodal Officer not found" });

        const updateData = { name, email, mobile, district };

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const updated = await NodalOfficer.findByIdAndUpdate(id, updateData, { new: true });
        res.json({ success: true, message: "Nodal Officer updated successfully", nodal: updated });
    } catch (error) {
        console.error("Error updating nodal officer:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteNodalOfficer = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { id } = req.params;
    try {
        await NodalOfficer.findByIdAndDelete(id);
        res.json({ success: true, message: "Nodal Officer deleted successfully" });
    } catch (error) {
        console.error("Error deleting nodal officer:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// --- Gallery Management ---

const getGalleryImages = async (req, res) => {
    try {
        const images = await GalleryImage.find({}).sort({ createdAt: -1 });
        res.json({ success: true, images });
    } catch (error) {
        console.error("Error fetching gallery images:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const addGalleryImage = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const { image, description } = req.body;
    if (!image || !description) {
        return res.status(400).json({ success: false, message: "Image and description are required" });
    }

    try {
        const newImage = new GalleryImage({ image, description });
        await newImage.save();
        res.json({ success: true, message: "Gallery image uploaded successfully", image: newImage });
    } catch (error) {
        console.error("Error adding gallery image:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateGalleryImage = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const { description } = req.body;
    const { id } = req.params;

    if (!description) {
        return res.status(400).json({ success: false, message: "Description is required" });
    }

    try {
        const updatedImage = await GalleryImage.findByIdAndUpdate(id, { description }, { new: true });
        if (!updatedImage) {
            return res.status(404).json({ success: false, message: "Gallery image not found" });
        }
        res.json({ success: true, message: "Gallery image updated successfully", image: updatedImage });
    } catch (error) {
        console.error("Error updating gallery image:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteGalleryImage = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;

    try {
        const deletedImage = await GalleryImage.findByIdAndDelete(id);
        if (!deletedImage) {
            return res.status(404).json({ success: false, message: "Gallery image not found" });
        }
        res.json({ success: true, message: "Gallery image deleted successfully" });
    } catch (error) {
        console.error("Error deleting gallery image:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// --- Administration Heads ---
const getAdminHeads = async (req, res) => {
    try {
        const heads = await AdminHead.find({}).sort({ displayOrder: 1, createdAt: 1 });
        res.json({ success: true, heads });
    } catch (error) {
        console.error("Error fetching admin heads:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const addAdminHead = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }
    const { position, photo, name, designation, qualification, displayOrder } = req.body;
    if (!position || !photo || !name || !designation || !qualification) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    try {
        const order = displayOrder !== undefined ? Number(displayOrder) : 0;
        const newHead = new AdminHead({ position, photo, name, designation, qualification, displayOrder: order });
        await newHead.save();
        res.json({ success: true, message: "Admin head added successfully", head: newHead });
    } catch (error) {
        console.error("Error adding admin head:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const updateAdminHead = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }
    const { id } = req.params;
    const { position, photo, name, designation, qualification, displayOrder } = req.body;
    try {
        const order = displayOrder !== undefined ? Number(displayOrder) : 0;
        const updatedHead = await AdminHead.findByIdAndUpdate(id, {
            position, photo, name, designation, qualification, displayOrder: order
        }, { new: true });
        if (!updatedHead) {
            return res.status(404).json({ success: false, message: "Admin head not found" });
        }
        res.json({ success: true, message: "Admin head updated successfully", head: updatedHead });
    } catch (error) {
        console.error("Error updating admin head:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteAdminHead = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" });
    }
    const { id } = req.params;
    try {
        const deletedHead = await AdminHead.findByIdAndDelete(id);
        if (!deletedHead) {
            return res.status(404).json({ success: false, message: "Admin head not found" });
        }
        res.json({ success: true, message: "Admin head deleted successfully" });
    } catch (error) {
        console.error("Error deleting admin head:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    getAdminStats,
    getAdminEvents,
    getAdminStudents,
    deleteOrganization,
    createNodalOfficer,
    getNodalOfficers,
    updateNodalOfficer,
    deleteNodalOfficer,
    getGalleryImages,
    addGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
    getAdminHeads,
    addAdminHead,
    updateAdminHead,
    deleteAdminHead
};
