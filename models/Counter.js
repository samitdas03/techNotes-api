const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
    count: {
        type: Number,
        default: 1,
    },
});

module.exports = mongoose.model("Counter", counterSchema);