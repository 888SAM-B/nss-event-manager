const crypto = require('crypto');

// Derive 32-byte encryption key using SHA-256 hash of ENCRYPTION_KEY or JWT_SECRET
const getDerivedKey = () => {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'nss_portal_fallback_secret_key_2026';
    return crypto.createHash('sha256').update(String(secret)).digest();
};

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt a plain string to format "ivHex:encryptedHex"
 */
const encryptText = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    const str = text.trim();
    if (!str) return '';

    try {
        const iv = crypto.randomBytes(16);
        const key = getDerivedKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(str, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (err) {
        console.error('Encryption error:', err);
        return text;
    }
};

/**
 * Decrypt string formatted as "ivHex:encryptedHex"
 * Safely returns original string if text is plain text or unencrypted (backward compatibility)
 */
const decryptText = (text) => {
    if (!text || typeof text !== 'string') return text || '';
    const str = text.trim();
    if (!str || !str.includes(':')) return str; // Unencrypted plain text

    const parts = str.split(':');
    if (parts.length !== 2) return str;

    const [ivHex, encryptedHex] = parts;
    if (ivHex.length !== 32 || !/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
        return str; // Not valid hex encryption format, return plain text
    }

    try {
        const key = getDerivedKey();
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption error:', err);
        return str; // Fallback to original text on decryption error
    }
};

/**
 * Encrypt bank details object before saving to database
 */
const encryptBankDetails = (bankDetails) => {
    if (!bankDetails) return {};
    return {
        zbsca: {
            accountNo: encryptText(bankDetails.zbsca?.accountNo),
            bankName: encryptText(bankDetails.zbsca?.bankName),
            branchName: encryptText(bankDetails.zbsca?.branchName),
            ifscCode: encryptText(bankDetails.zbsca?.ifscCode)
        },
        vendor: {
            vendorName: encryptText(bankDetails.vendor?.vendorName),
            accountNo: encryptText(bankDetails.vendor?.accountNo),
            bankName: encryptText(bankDetails.vendor?.bankName),
            branchName: encryptText(bankDetails.vendor?.branchName),
            ifscCode: encryptText(bankDetails.vendor?.ifscCode)
        }
    };
};

/**
 * Decrypt bank details object after fetching from database
 */
const decryptBankDetails = (bankDetails) => {
    if (!bankDetails) return {};
    return {
        zbsca: {
            accountNo: decryptText(bankDetails.zbsca?.accountNo),
            bankName: decryptText(bankDetails.zbsca?.bankName),
            branchName: decryptText(bankDetails.zbsca?.branchName),
            ifscCode: decryptText(bankDetails.zbsca?.ifscCode)
        },
        vendor: {
            vendorName: decryptText(bankDetails.vendor?.vendorName),
            accountNo: decryptText(bankDetails.vendor?.accountNo),
            bankName: decryptText(bankDetails.vendor?.bankName),
            branchName: decryptText(bankDetails.vendor?.branchName),
            ifscCode: decryptText(bankDetails.vendor?.ifscCode)
        }
    };
};

module.exports = {
    encryptText,
    decryptText,
    encryptBankDetails,
    decryptBankDetails
};
