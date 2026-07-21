const Circular = require('../models/Circular');

// Create new circular (Admin or Nodal Officer)
const createCircular = async (req, res) => {
    try {
        const { title, content, targetAudience, attachments, postedByName } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required.' });
        }

        const validAudience = ['all', 'college', 'unit'].includes(targetAudience) ? targetAudience : 'all';

        let processedAttachments = [];

        // Handle uploaded files via multer if present
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const ext = file.originalname.split('.').pop().toLowerCase();
                let fileType = 'file';
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';
                else if (ext === 'pdf') fileType = 'pdf';

                processedAttachments.push({
                    name: file.originalname,
                    fileUrl: `uploads/${file.filename}`,
                    fileType: fileType
                });
            });
        }

        // Handle JSON array of attachments (like external links or pre-uploaded files)
        if (attachments) {
            let parsedAttachments = attachments;
            if (typeof attachments === 'string') {
                try {
                    parsedAttachments = JSON.parse(attachments);
                } catch (e) {
                    parsedAttachments = [];
                }
            }
            if (Array.isArray(parsedAttachments)) {
                parsedAttachments.forEach(att => {
                    if (att.name && att.fileUrl) {
                        processedAttachments.push({
                            name: att.name,
                            fileUrl: att.fileUrl,
                            fileType: att.fileType || 'link'
                        });
                    }
                });
            }
        }

        const senderRole = req.user?.role || 'admin';
        const senderName = postedByName || req.user?.name || (senderRole === 'admin' ? 'System Administrator' : 'District Nodal Officer');
        const senderDistrict = req.user?.district || '';

        const newCircular = new Circular({
            title: title.trim(),
            content: content.trim(),
            targetAudience: validAudience,
            attachments: processedAttachments,
            postedByName: senderName,
            postedByRole: senderRole === 'nodal' ? 'nodal' : 'admin',
            postedByDistrict: senderDistrict
        });

        await newCircular.save();

        res.status(201).json({
            success: true,
            message: 'Circular published successfully!',
            circular: newCircular
        });
    } catch (error) {
        console.error('Error creating circular:', error);
        res.status(500).json({ success: false, message: 'Server error creating circular.' });
    }
};

// Get circulars filtered by target role
const getCirculars = async (req, res) => {
    try {
        const userRole = req.user?.role || 'all';
        let query = {};

        // Filtering based on role
        if (userRole === 'college') {
            query.targetAudience = { $in: ['all', 'college'] };
        } else if (userRole === 'unit') {
            query.targetAudience = { $in: ['all', 'unit'] };
        }
        // Admin and Nodal can view all circulars

        const circulars = await Circular.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            circulars
        });
    } catch (error) {
        console.error('Error fetching circulars:', error);
        res.status(500).json({ success: false, message: 'Server error fetching circulars.' });
    }
};

// Delete circular by ID
const deleteCircular = async (req, res) => {
    try {
        const { id } = req.params;
        const circular = await Circular.findById(id);

        if (!circular) {
            return res.status(404).json({ success: false, message: 'Circular not found.' });
        }

        // Only admin or nodal officers can delete
        if (req.user?.role !== 'admin' && req.user?.role !== 'nodal') {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete circular.' });
        }

        await Circular.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Circular deleted successfully.'
        });
    } catch (error) {
        console.error('Error deleting circular:', error);
        res.status(500).json({ success: false, message: 'Server error deleting circular.' });
    }
};

module.exports = {
    createCircular,
    getCirculars,
    deleteCircular
};
