// BUG-18: This file re-exports from the canonical middlewares/auth.js
// to prevent crashes if any old code accidentally imports from this path.
const auth = require('../middlewares/auth');
module.exports = auth.verifyToken;
