const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Validate required environment variables on startup
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URL', 'PORT'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`❌ CRITICAL STARTUP ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ WARNING: JWT_SECRET is weaker than recommended (less than 256 bits / 32 characters).');
}

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple test root route
app.get('/', (_req, res) => {
    res.send('Hello, World! NSS Portal V2 API is running.');
});

// Import modular routes
const authRoutes = require('./routes/authRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const unitRoutes = require('./routes/unitRoutes');
const eventRoutes = require('./routes/eventRoutes');
const programOfficerRoutes = require('./routes/programOfficerRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Mount routes
app.use(authRoutes);
app.use(collegeRoutes);
app.use(unitRoutes);
app.use(eventRoutes);
app.use(programOfficerRoutes);
app.use(reportRoutes);
app.use(require('./routes/adminRoutes')); // admin, nodal & gallery routes

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});