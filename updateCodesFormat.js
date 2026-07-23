require('dotenv').config();
const mongoose = require('mongoose');

// Import Models
const User = require('./models/User');
const Unit = require('./models/Unit');
const ProgramOfficer = require('./models/ProgramOfficer');
const Member = require('./models/Member');
const Event = require('./models/Event');

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("❌ Error: MONGODB_URL is not set in .env file.");
    process.exit(1);
}

async function migrateUnitAndEventCodes() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL);
        console.log("✅ Connected successfully!");

        console.log("\n🔄 Starting migration of Unit Numbers and Event Codes to hyphenated format...");

        const units = await Unit.find().populate('collegeId');
        console.log(`Found ${units.length} Unit(s) in database.`);

        let updatedUnitsCount = 0;
        let updatedPOsCount = 0;
        let updatedEventsCount = 0;

        // Group units by college to assign clean 2-digit sequences per college
        const collegeUnitsMap = {};
        for (const unit of units) {
            const colId = unit.collegeId ? unit.collegeId._id.toString() : 'unknown';
            if (!collegeUnitsMap[colId]) collegeUnitsMap[colId] = [];
            collegeUnitsMap[colId].push(unit);
        }

        for (const [colId, colUnits] of Object.entries(collegeUnitsMap)) {
            for (let idx = 0; idx < colUnits.length; idx++) {
                const unit = colUnits[idx];
                const oldUnitNumber = unit.unitNumber;
                const collegeCode = unit.collegeId ? unit.collegeId.code : 'COLLEGE';
                const sequence = String(idx + 1).padStart(2, '0');
                const newUnitNumber = `NSS-${collegeCode}-${sequence}`;

                // Update Unit Number if changed
                if (oldUnitNumber !== newUnitNumber) {
                    unit.unitNumber = newUnitNumber;
                    await unit.save();
                    updatedUnitsCount++;
                    console.log(` ✏️ Unit updated: "${oldUnitNumber}" ➔ "${newUnitNumber}"`);

                    // Update Program Officers linking this unit
                    const poResult = await ProgramOfficer.updateMany(
                        { unit: oldUnitNumber },
                        { unit: newUnitNumber }
                    );
                    updatedPOsCount += poResult.modifiedCount;
                }

                // Update Events for this unit
                const events = await Event.find({
                    $or: [
                        { unitId: unit._id },
                        { unitCode: oldUnitNumber },
                        { unitCode: newUnitNumber }
                    ]
                }).sort({ createdAt: 1, date: 1 });

                for (let eIdx = 0; eIdx < events.length; eIdx++) {
                    const event = events[eIdx];
                    const eventSeq = String(eIdx + 1).padStart(3, '0');
                    const newEventCode = `NSSEVT-${newUnitNumber}-${eventSeq}`;

                    let modified = false;
                    if (event.unitCode !== newUnitNumber) {
                        event.unitCode = newUnitNumber;
                        modified = true;
                    }
                    if (event.eventCode !== newEventCode) {
                        event.eventCode = newEventCode;
                        modified = true;
                    }

                    if (modified) {
                        await event.save();
                        updatedEventsCount++;
                        console.log(`    📅 Event code updated: "${event.name}" ➔ ${newEventCode}`);
                    }
                }
            }
        }

        console.log("\n✨ Migration Summary:");
        console.log(` - Units updated: ${updatedUnitsCount}`);
        console.log(` - Program Officers updated: ${updatedPOsCount}`);
        console.log(` - Event Codes updated: ${updatedEventsCount}`);
        console.log("\n✅ Code format migration completed successfully!");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error during migration:", error);
        process.exit(1);
    }
}

migrateUnitAndEventCodes();
