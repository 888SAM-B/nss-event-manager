const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

const unitSchema = new mongoose.Schema({
    name: String,
    head: String,
    password: String,
    contact: String,
    mail: String,
    members: Array,
    unitNumber: String,
    createdDate: String,
    events: { type: Array, default: [] },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Unit = mongoose.model('Unit', unitSchema);

const insLoginScheme = new mongoose.Schema({
    userName: String,
    password: String,
    insName: String,
    events: { type: Array, default: [] },
    code: String,
    units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }]
});

const User = mongoose.model('User', insLoginScheme);


const eventSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    singleDay: Boolean,
    date: String,
    dateFrom: String,
    dateTo: String,
    timeFrom: String,
    timeTo: String,
    venue: String,
    images: Array,
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Event = mongoose.model('Event', eventSchema);


app.get('/', (_req, res) => {
    res.send('Hello, World!');
});

app.post('/login', async (req, res) => {
    console.log('inside login');
    const { username, password } = req.body;
    console.log(username, password);
    console.log(await User.find())
    const user = await User.findOne({ userName: username, password });
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid username or password"
        });
    }
    const token = jwt.sign(
        { userName: username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({
        success: true,
        token
    });
});
app.get('/college-dashboard', async (req, res) => {
    console.log('inside college-dashboard');

    const { username } = req.query;
    console.log(username);

    if (!username) {
        return res.status(400).json({
            success: false,
            message: "Username is required"
        });
    }

    const user = await User.findOne({ userName: username }).populate('units');

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User not found"
        });
    }

    res.json({
        success: true,
        user
    });
});

app.post('/addUnit', async (req, res) => {
    console.log('inside addUnit');
    const { username, name, password, head, contact, mail, members, unitNumber, createdDate } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required" });
    }

    try {
        const user = await User.findOne({ userName: username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.units.length > 6) {
            return res.status(400).json({ success: false, message: "Maximum 6 units allowed" });
        }

        const newUnit = new Unit({
            name,
            head,
            password,
            contact,
            mail: mail,
            members,
            unitNumber,
            createdDate,
            collegeId: user._id
        });
        console.log(newUnit);
        await newUnit.save();

        user.units.push(newUnit._id);
        await user.save();

        res.json({
            success: true,
            message: "Unit added successfully",
            unit: newUnit
        });
    } catch (error) {
        console.error("Error adding unit:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.delete('/deleteUnit', async (req, res) => {
    const { username, unitNumber } = req.body;

    if (!username || !unitNumber) {
        return res.status(400).json({ success: false, message: "Username and Unit Number are required" });
    }

    try {
        const user = await User.findOne({ userName: username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const unit = await Unit.findOne({ unitNumber: unitNumber, collegeId: user._id });

        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        await Unit.findByIdAndDelete(unit._id);

        user.units.pull(unit._id);
        await user.save();

        res.json({
            success: true,
            message: "Unit deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting unit:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post('/unit-login', async (req, res) => {
    console.log('inside unit-login');
    const { collegeCode, unitCode, unitPassword } = req.body;
    console.log(collegeCode, unitCode, unitPassword);
    const user = await User.findOne({ code: collegeCode });
    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid college code" });
    }
    const unit = await Unit.findOne({ unitNumber: unitCode, collegeId: user._id });
    if (!unit) {
        return res.status(401).json({ success: false, message: "Invalid unit code" });
    }
    if (unit.password !== unitPassword) {
        return res.status(401).json({ success: false, message: "Invalid unit password" });
    }
    const token = jwt.sign({ unitNumber: unitCode }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, token });
});

app.get('/unit-dashboard/:unitCode', async (req, res) => {
    console.log('inside unit-dashboard');

    const { unitCode } = req.params; // 👈 PARAMS
    console.log("Unit Code:", unitCode);

    if (!unitCode) {
        return res.status(400).json({ success: false, message: "Unit Code is required" });
    }

    const unit = await Unit.findOne({ unitNumber: unitCode });
    if (!unit) {
        return res.status(401).json({ success: false, message: "Unit not found" });
    }
    console.log(unit);
    const college = await User.findOne({ _id: unit.collegeId });

    res.json({ success: true, unit, college });
});

app.put('/update-unit-members', async (req, res) => {
    const { unitCode, members } = req.body;
    if (!unitCode || !members) {
        return res.status(400).json({ success: false, message: "Unit Code and Members are required" });
    }

    try {
        const unit = await Unit.findOne({ unitNumber: unitCode });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        unit.members = members;
        await unit.save();

        res.json({ success: true, message: "Members updated successfully", unit });
    } catch (error) {
        console.error("Error updating members:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.post('/add-unit-member', async (req, res) => {
    const { unitCode, member } = req.body;
    if (!unitCode || !member) {
        return res.status(400).json({ success: false, message: "Unit Code and Member details are required" });
    }

    try {
        const unit = await Unit.findOne({ unitNumber: unitCode });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }

        unit.members.push(member);
        await unit.save();

        res.json({ success: true, message: "Member added successfully", unit });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.delete('/delete-unit-member', async (req, res) => {
    const { unitCode, member } = req.body;
    if (!unitCode || !member) {
        return res.status(400).json({ success: false, message: "Unit Code and Member     are required" });
    }
    try {
        const unit = await Unit.findOne({ unitNumber: unitCode });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }
        unit.members = unit.members.filter(m => m.regNo !== member.regNo);
        await unit.save();
        res.json({ success: true, message: "Member deleted successfully", unit });
    } catch (error) {
        console.error("Error deleting member:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


app.post('/addEvent', async (req, res) => {
    console.log("inside add event")
    const { eventData } = req.body;
    console.log(eventData)
    if (!eventData) {
        return res.status(400).json({ success: false, message: "Event details are required" });
    }
    console.log(eventData);
    try {
        const unit = await Unit.findOne({ unitNumber: eventData.unitCode });
        if (!unit) {
            return res.status(404).json({ success: false, message: "Unit not found" });
        }
        const college = await User.findOne({ code: eventData.collegeCode });
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        const newEvent = new Event({
            ...eventData,
            unitId: unit._id,
            collegeId: college._id
        });
        await newEvent.save();
        console.log(newEvent._id, "id");
        unit.events.push(newEvent._id);
        await unit.save();
        college.events.push(newEvent._id);
        await college.save();
        res.json({ success: true, message: "Event added successfully", event: newEvent });
    } catch (error) {
        console.error("Error adding event:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});