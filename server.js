const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const mongoURI = process.env.MONGODB_URL;
console.log("MongoDB URL check:", mongoURI)

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

const insLoginScheme = new mongoose.Schema({
    userName: String,
    password: String
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

    const user = await User.findOne({ userName: username });

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


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});