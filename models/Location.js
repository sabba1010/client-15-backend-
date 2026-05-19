const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true,
        trim: true,
    },
    region: {
        type: String,
        required: true,
        trim: true,
    }
}, {
    timestamps: true,
});

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;
