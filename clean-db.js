require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("Error: MONGODB_URL not found in .env file.");
    process.exit(1);
}

async function cleanDatabase() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGODB_URL);
        console.log("Connected successfully!");

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log(`Found ${collections.length} collections. Starting cleanup...`);

        for (const col of collections) {
            // Skip system collections if any
            if (col.name.startsWith('system.')) continue;
            
            console.log(`Clearing collection: ${col.name}...`);
            const result = await db.collection(col.name).deleteMany({});
            console.log(`Cleared ${col.name}. Deleted ${result.deletedCount || 0} documents.`);
        }

        console.log("Database cleanup completed successfully!");
    } catch (error) {
        console.error("An error occurred during database cleanup:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from database.");
    }
}

cleanDatabase();
