const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    }
}, {
    timestamps: true,
});

categorySchema.pre('save', function () {
    if (this.slug) {
        this.slug = this.slug
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-');
    }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
