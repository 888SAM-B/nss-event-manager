const bcrypt = require('bcryptjs');

const comparePassword = async (candidate, target, doc) => {
    if (!target) return false;
    if (target.startsWith('$2')) {
        return await bcrypt.compare(candidate, target);
    } else {
        // Plain text fallback + Migration
        if (candidate === target) {
            const salt = await bcrypt.genSalt(10);
            doc.password = await bcrypt.hash(candidate, salt);
            await doc.save();
            return true;
        }
        return false;
    }
};

module.exports = {
    comparePassword
};
