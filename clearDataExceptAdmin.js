require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const Unit = require('./models/Unit');
const ProgramOfficer = require('./models/ProgramOfficer');
const Member = require('./models/Member');
const Event = require('./models/Event');
const PeriodicalReport = require('./models/PeriodicalReport');
const Circular = require('./models/Circular');
const GalleryImage = require('./models/GalleryImage');
const NodalOfficer = require('./models/NodalOfficer');
const AdminHead = require('./models/AdminHead');

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("❌ Error: MONGODB_URL is not set in .env file.");
    process.exit(1);
}

async function clearDataExceptAdmin() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("✅ Connected successfully!");

        console.log("\n📊 Current Database Summary before cleanup:");
        const usersCount = await User.countDocuments();
        const unitsCount = await Unit.countDocuments();
        const poCount = await ProgramOfficer.countDocuments();
        const membersCount = await Member.countDocuments();
        const eventsCount = await Event.countDocuments();
        const reportsCount = await PeriodicalReport.countDocuments();
        const circularsCount = await Circular.countDocuments();
        const galleryCount = await GalleryImage.countDocuments();
        const nodalCount = await NodalOfficer.countDocuments();
        const adminHeadsCount = await AdminHead.countDocuments();

        console.log(` - Colleges (User): ${usersCount}`);
        console.log(` - Units: ${unitsCount}`);
        console.log(` - Program Officers: ${poCount}`);
        console.log(` - Volunteers (Member): ${membersCount}`);
        console.log(` - Events: ${eventsCount}`);
        console.log(` - Periodical Reports: ${reportsCount}`);
        console.log(` - Circulars: ${circularsCount}`);
        console.log(` - Gallery / Event Images (TO BE KEPT): ${galleryCount}`);
        console.log(` - Nodal Officers: ${nodalCount}`);
        console.log(` - Admin Heads (TO BE KEPT): ${adminHeadsCount}`);

        console.log("\n🧹 Removing operational data (keeping Admin Heads & Gallery/Event Images)...");

        const deletedUsers = await User.deleteMany({});
        const deletedUnits = await Unit.deleteMany({});
        const deletedPOs = await ProgramOfficer.deleteMany({});
        const deletedMembers = await Member.deleteMany({});
        const deletedEvents = await Event.deleteMany({});
        const deletedReports = await PeriodicalReport.deleteMany({});
        const deletedCirculars = await Circular.deleteMany({});
        const deletedNodals = await NodalOfficer.deleteMany({});

        console.log("\n✨ Cleanup Results:");
        console.log(` - Removed ${deletedUsers.deletedCount} Colleges`);
        console.log(` - Removed ${deletedUnits.deletedCount} Units`);
        console.log(` - Removed ${deletedPOs.deletedCount} Program Officers`);
        console.log(` - Removed ${deletedMembers.deletedCount} Volunteers`);
        console.log(` - Removed ${deletedEvents.deletedCount} Events`);
        console.log(` - Removed ${deletedReports.deletedCount} Periodical Reports`);
        console.log(` - Removed ${deletedCirculars.deletedCount} Circulars`);
        console.log(` - Removed ${deletedNodals.deletedCount} Nodal Officers`);

        const remainingAdminHeads = await AdminHead.countDocuments();
        const remainingGallery = await GalleryImage.countDocuments();
        console.log(`\n🛡️ Preserved Data:`);
        console.log(` - ${remainingAdminHeads} Admin Head record(s) intact.`);
        console.log(` - ${remainingGallery} Gallery / Event Image(s) intact.`);
        console.log("🔑 System Admin credentials (from .env) remain active.");

        console.log("\n✅ Data cleanup completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error clearing database:", error);
        process.exit(1);
    }
}

clearDataExceptAdmin();
