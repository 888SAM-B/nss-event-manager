require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('./models/User'); // College
const Unit = require('./models/Unit');
const ProgramOfficer = require('./models/ProgramOfficer');
const Member = require('./models/Member'); // Volunteer
const Event = require('./models/Event');
const NodalOfficer = require('./models/NodalOfficer');
const AdminHead = require('./models/AdminHead');

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("Error: MONGODB_URL not found in .env file.");
    process.exit(1);
}

async function seedDatabase() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGODB_URL);
        console.log("Connected successfully!");

        // 1. Database Cleanup Skipped (Preserving existing data)
        console.log("Preserving existing data in database...");

        // 2. Generate Hashed Passwords
        console.log("Generating password hashes...");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("password123", salt);
        const hashedPasskey = await bcrypt.hash("passkey123", salt);

        // 3. Seed Nodal Officer
        console.log("Seeding Nodal Officers...");
        let nodal1 = await NodalOfficer.findOne({ email: "nodal1@example.com" });
        if (!nodal1) {
            nodal1 = await NodalOfficer.create({
                name: "Sample Nodal Officer One",
                email: "nodal1@example.com",
                mobile: "9876543210",
                password: hashedPassword,
                district: "Sample District North"
            });
        }
        let nodal2 = await NodalOfficer.findOne({ email: "nodal2@example.com" });
        if (!nodal2) {
            nodal2 = await NodalOfficer.create({
                name: "Sample Nodal Officer Two",
                email: "nodal2@example.com",
                mobile: "9876543211",
                password: hashedPassword,
                district: "Sample District South"
            });
        }

        // 4. Seed Admin Head
        console.log("Seeding Admin Head...");
        let adminHead = await AdminHead.findOne({ position: "State NSS Officer" });
        if (!adminHead) {
            await AdminHead.create({
                position: "State NSS Officer",
                photo: "https://via.placeholder.com/150",
                name: "Sample Admin Head",
                designation: "State Liaison Officer",
                qualification: "Ph.D.",
                rowOrder: 1,
                displayOrder: 1
            });
        }

        // 5. Seed 5 Colleges
        console.log("Seeding 5 Colleges...");
        const collegeNames = [
            "Sample College of Engineering",
            "Sample College of Arts and Science",
            "Sample College of Education",
            "Sample Institute of Management",
            "Sample Polytechnic College"
        ];
        
        const colleges = [];
        for (let i = 0; i < 5; i++) {
            const colIndex = i + 1;
            const code = `COLL00${colIndex}`;
            let college = await User.findOne({ code: code });
            if (!college) {
                college = await User.create({
                    userName: `college${colIndex}@example.com`,
                    password: hashedPassword,
                    insName: collegeNames[i],
                    code: code,
                    collegeType: i % 2 === 0 ? "Funded" : "Self-Financed",
                    isRegistered: true,
                    passkey: hashedPasskey,
                    location: `Sample Town ${String.fromCharCode(65 + i)}`,
                    district: i < 3 ? "Sample District North" : "Sample District South",
                    universityName: "Sample University",
                    principalDetails: {
                        name: `Sample Principal ${colIndex}`,
                        email: `principal${colIndex}@example.com`,
                        mobile: `987654301${i}`
                    },
                    collegeDetails: {
                        email: `info${colIndex}@example.com`,
                        phone: `044-123456${i}`,
                        website: `www.college${colIndex}.edu`
                    },
                    collegeLocation: {
                        address: `${colIndex}0${colIndex}, Main Street, Sample Town ${String.fromCharCode(65 + i)}`,
                        district: i < 3 ? "Sample District North" : "Sample District South",
                        taluk: `Sample Taluk ${colIndex}`,
                        pincode: `60000${colIndex}`
                    },
                    adoptingVillages: [
                        {
                            name: `Sample Adopted Village ${colIndex}A`,
                            address: "Village Street 1",
                            block: "Sample Block",
                            taluk: `Sample Taluk ${colIndex}`,
                            district: i < 3 ? "Sample District North" : "Sample District South",
                            pincode: `60010${colIndex}`,
                            distance: 4 + i
                        },
                        {
                            name: `Sample Adopted Village ${colIndex}B`,
                            address: "Village Street 2",
                            block: "Sample Block",
                            taluk: `Sample Taluk ${colIndex}`,
                            district: i < 3 ? "Sample District North" : "Sample District South",
                            pincode: `60020${colIndex}`,
                            distance: 10 + i
                        }
                    ]
                });
            }
            colleges.push(college);
        }

        // 6. Seed 12 Units & Program Officers (2 or 3 per College)
        console.log("Seeding 12 Units and Program Officers...");
        const units = [];
        const programOfficers = [];
        
        let unitCounter = 1;
        // Distribution of units: [2, 3, 2, 2, 3] for the 5 colleges
        const unitsPerCollege = [2, 3, 2, 2, 3];

        for (let c = 0; c < colleges.length; c++) {
            const college = colleges[c];
            const numUnits = unitsPerCollege[c];
            const collegeUnitIds = [];

            for (let u = 0; u < numUnits; u++) {
                const poIndex = unitCounter;
                const collegeSequence = String(u + 1).padStart(2, '0');
                const unitNumber = `NSS-${college.code}-${collegeSequence}`;
                
                // Create Program Officer if not exists
                let po = await ProgramOfficer.findOne({ email: `po${poIndex}@example.com` });
                if (!po) {
                    po = await ProgramOfficer.create({
                        name: `Sample Program Officer ${poIndex}`,
                        designation: poIndex % 2 === 0 ? "Associate Professor" : "Assistant Professor",
                        department: poIndex % 3 === 0 ? "Computer Science" : (poIndex % 3 === 1 ? "Information Technology" : "Mechanical Eng"),
                        unit: unitNumber,
                        college: college.insName,
                        email: `po${poIndex}@example.com`,
                        mobile: `98765431${poIndex < 10 ? '0' + poIndex : poIndex}`,
                        gender: poIndex % 2 === 0 ? "Male" : "Female",
                        collegeId: college._id,
                        officerID: `PO-UNIT-${poIndex}`
                    });
                }
                programOfficers.push(po);

                // Create Unit if not exists
                let unit = await Unit.findOne({ unitNumber: unitNumber });
                if (!unit) {
                    unit = await Unit.create({
                        name: `Sample NSS Unit ${poIndex}`,
                        head: po._id,
                        contact: po.mobile,
                        mail: po.email,
                        password: hashedPassword,
                        unitNumber: unitNumber,
                        createdDate: "2021-01-15",
                        collegeId: college._id
                    });
                }
                units.push(unit);
                collegeUnitIds.push(unit._id);
                unitCounter++;
            }

            if (!college.units || college.units.length === 0) {
                college.units = collegeUnitIds;
                await college.save();
            }
        }

        // 7. Seed 40+ Volunteers (Distributed among units)
        console.log("Seeding 48 Volunteers...");
        const volunteers = [];
        const genderOptions = ["Male", "Female"];
        const bloodGroups = ["A+", "B+", "O+", "AB+", "O-", "A-"];
        const communities = ["General", "OBC", "SC", "ST"];

        for (let v = 1; v <= 48; v++) {
            // Distribute volunteers evenly among the 12 units (4 volunteers per unit)
            const unitIdx = Math.floor((v - 1) / 4);
            const unit = units[unitIdx];
            const college = colleges.find(col => col._id.toString() === unit.collegeId.toString());

            const regNo = `REG${1000 + v}`;
            let volunteer = await Member.findOne({ regNo: regNo });
            if (!volunteer) {
                volunteer = await Member.create({
                    name: `Sample Volunteer ${v}`,
                    regNo: regNo,
                    dept: "Engineering Department",
                    course: "B.Tech",
                    community: communities[v % communities.length],
                    contact: `98765440${v < 10 ? '0' + v : v}`,
                    bloodGroup: bloodGroups[v % bloodGroups.length],
                    dob: "2006-05-15",
                    batchFrom: "2024",
                    batchTo: "2027",
                    unitId: unit._id,
                    collegeId: college._id,
                    sex: genderOptions[v % genderOptions.length],
                    aadhaar: `1234567890${10 + v}`,
                    enrolmentDate: "2024-07-20",
                    isEnrolled: true
                });

                if (!unit.members.includes(volunteer._id)) {
                    unit.members.push(volunteer._id);
                }
            }

            volunteers.push(volunteer);
        }

        // Save updated units with volunteer ids
        for (const unit of units) {
            await unit.save();
        }

        // 8. Seed 25 Events (with various states, categories, and assignments)
        console.log("Seeding 25 Events...");
        
        const categories = [
            "Special Camp",
            "Blood Donation", 
            "Tree Plantation", 
            "Cleanliness Rally", 
            "Health & Hygiene Awareness",
            "Disaster Management Training", 
            "Digital Literacy Workshop", 
            "Road Safety Awareness"
        ];

        const venues = [
            "College Auditorium", 
            "Campus Ground", 
            "Adopted Village Square", 
            "Local Primary School", 
            "Government Hospital Seminar Room"
        ];

        const dates = [
            { date: "2026-04-10" },
            { date: "2026-04-22" },
            { date: "2026-05-08" },
            { date: "2026-05-20" },
            { date: "2026-06-05" },
            { date: "2026-06-18" },
            { date: "2026-07-03" },
            { date: "2026-07-14" }
        ];

        const multiDayPastEvents = [
            { dateFrom: "2026-04-15", dateTo: "2026-04-17" },
            { dateFrom: "2026-05-10", dateTo: "2026-05-12" },
            { dateFrom: "2026-06-20", dateTo: "2026-06-22" },
            { dateFrom: "2026-07-05", dateTo: "2026-07-07" }
        ];

        // Let's programmatically generate 25 events
        for (let e = 1; e <= 25; e++) {
            // Distribute events across units: Unit 1 to Unit 12
            const unitIdx = (e - 1) % 12;
            const unit = units[unitIdx];
            const college = colleges.find(col => col._id.toString() === unit.collegeId.toString());

            const isExternal = e > 20; // 5 external events (events 21-25)
            const category = categories[e % categories.length];
            const venue = venues[e % venues.length];
            
            // Generate distinct Event Code
            const eventCode = `NSSEVT-${unit.unitNumber}-${String(e).padStart(3, '0')}`;

            let existingEvent = await Event.findOne({ eventCode: eventCode });
            if (!existingEvent) {
                let eventObj = {
                    name: `Sample ${category} Event ${e}`,
                    description: `A sample event focused on ${category.toLowerCase()} activities to engage volunteers and benefit local community residents.`,
                    category: category,
                    venue: venue,
                    resourcePerson: `Dr. Sample Speaker ${e}`,
                    level: e % 5 === 0 ? "National" : (e % 4 === 0 ? "State" : "College"),
                    sponsorship: e % 3 === 0 ? "Self-Funded" : "University Funded",
                    registeredMeriBharath: e % 2 === 0 ? "Yes" : "No",
                    meriBharathUrl: e % 2 === 0 ? `https://meribharath.gov.in/sample-${e}` : "",
                    images: [],
                    eventCode: eventCode,
                    unitId: unit._id,
                    collegeId: college._id,
                    isExternal: isExternal
                };

                // Completed vs Upcoming
                const isCompleted = e <= 16 && e !== 13; // 15 completed events, 5 upcoming, 5 external

                // Set Dates — ALL completed events fall within Apr–Jul 2026 (NSS annual year)
                if (isCompleted) {
                    if (e % 3 === 0) {
                        // Multi-day event in the past
                        const mdIdx = Math.floor((e / 3) - 1) % multiDayPastEvents.length;
                        const md = multiDayPastEvents[mdIdx];
                        eventObj.singleDay = false;
                        eventObj.dateFrom = md.dateFrom;
                        eventObj.dateTo = md.dateTo;
                        eventObj.timeFrom = "09:00";
                        eventObj.timeTo = "16:00";
                    } else {
                        // Single day in the past
                        eventObj.singleDay = true;
                        eventObj.date = dates[e % dates.length].date;
                        eventObj.timeFrom = "10:00";
                        eventObj.timeTo = "13:00";
                    }
                } else {
                    if (e % 3 === 0) {
                        // Multi-day event in the future
                        eventObj.singleDay = false;
                        eventObj.dateFrom = `2026-08-1${e % 9}`;
                        eventObj.dateTo = `2026-08-2${e % 9}`;
                        eventObj.timeFrom = "09:00";
                        eventObj.timeTo = "16:00";
                    } else {
                        // Single day in the future
                        eventObj.singleDay = true;
                        eventObj.date = `2026-08-${10 + (e % 10)}`;
                        eventObj.timeFrom = "10:00";
                        eventObj.timeTo = "13:00";
                    }
                }

                // Assign attendees (especially for external events)
                const unitVolunteers = volunteers.filter(vol => vol.unitId.toString() === unit._id.toString());
                if (isExternal) {
                    // Select 2 volunteers to participate in the external event
                    eventObj.attendees = [unitVolunteers[0]?._id, unitVolunteers[1]?._id].filter(Boolean);
                }
                
                if (isCompleted && !isExternal) {
                    // Add Report details
                    eventObj.report = {
                        conductedOnDate: true,
                        participantsCount: 20 + (e * 2),
                        collegesCount: 1,
                        outcome: `Successfully completed the ${category.toLowerCase()} campaign with high volunteer enthusiasm.`,
                        guests: [`Dr. Sample Speaker ${e}`, "Principal of the College"],
                        volunteersParticipated: 10 + (e % 5),
                        beneficiaries: "General Public and Students",
                        submittedAt: new Date(),
                        organizingUnits: [unit.name]
                    };

                    // Add category specific metrics
                    if (category === "Tree Plantation") {
                        eventObj.report.treesPlanted = 15 + e;
                    } else if (category === "Blood Donation") {
                        eventObj.report.bloodUnitsCollected = 20 + e;
                    }
                }

                await Event.create(eventObj);
            }
        }

        console.log("Database seeded safely without deleting existing data!");
    } catch (error) {
        console.error("An error occurred during database seeding:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from database.");
    }
}

seedDatabase();
