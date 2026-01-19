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
    code: String,
    units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }]
});

const User = mongoose.model('User', insLoginScheme);

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

    const { username } = req.query;   // ✅ params from URL
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
    const { username, name, password, head, contact, members, unitNumber, createdDate } = req.body;

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
            members,
            unitNumber,
            createdDate,
            collegeId: user._id
        });

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


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});