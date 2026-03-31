const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    exercise: {
        type: Boolean,
        default: false
    },
    medicine: {
        type: Boolean,
        default: false
    },
    diet: {
        type: Boolean,
        default: false
    },
    water: {
        type: Boolean,
        default: false
    },
    sleep: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// 🔥 Prevent duplicate entries for same user + date
taskSchema.index({ email: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Task", taskSchema);