const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    excerpt: {
        type: String,
        required: true,
    },
    writer: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
