console.log("🔥 SERVER FILE LOADED");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");
const Task = require("./models/Task");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// ✅ JWT MIDDLEWARE
// ==========================
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token" });
    }

    // 🔥 FIX: handle "Bearer token"
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

// ==========================
// ✅ MongoDB
// ==========================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log("Mongo Error ❌", err));

// ==========================
// ✅ TEST
// ==========================
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

// ==========================
// ✅ SIGNUP
// ==========================
app.post("/api/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({ email, password: hashedPassword });

        res.json({ message: "Signup successful" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================
// ✅ LOGIN
// ==========================
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Wrong password" });
        }

        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ message: "Login successful", token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================
// ✅ SAVE TASK (UPDATE OR CREATE)
// ==========================
app.post("/api/tasks", authMiddleware, async (req, res) => {
    try {
        const email = req.user.email;
        const { date } = req.body;

        const existing = await Task.findOne({ email, date });

        if (existing) {
            await Task.updateOne(
                { email, date },
                { ...req.body, email }
            );
            return res.json({ message: "Updated" });
        }

        await Task.create({ ...req.body, email });

        res.json({ message: "Saved" });

    } catch (err) {
        console.log("POST ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================
// ✅ GET ALL TASKS
// ==========================
app.get("/api/tasks", authMiddleware, async (req, res) => {
    try {
        const email = req.user.email;

        const tasks = await Task.find({ email });

        res.json(tasks);
    } catch (err) {
        console.log("GET ALL ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================
// ✅ GET TASK BY DATE
// ==========================
app.get("/api/tasks/:date", authMiddleware, async (req, res) => {
    try {
        const email = req.user.email;
        const { date } = req.params;

        const task = await Task.findOne({ email, date });

        res.json(task);
    } catch (err) {
        console.log("GET DATE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

//=====================================================



// ==========================
// ✅ START SERVER
// ==========================
app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});