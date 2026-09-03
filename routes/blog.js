const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/blogs
// @desc    Create a new blog post
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { image, title, category, excerpt, writer } = req.body;

        // Validate required fields before hitting Mongoose
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required.' });
        }
        if (!excerpt || !excerpt.trim()) {
            return res.status(400).json({ message: 'Excerpt is required.' });
        }
        if (!writer || !writer.trim()) {
            return res.status(400).json({ message: 'Writer is required.' });
        }
        if (!image) {
            return res.status(400).json({ message: 'Image is required.' });
        }

        // Validate category is a real ObjectId before querying
        if (!category || !mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ message: 'A valid category must be selected.' });
        }

        const blog = await Blog.create({
            image,
            title: title.trim(),
            category,
            excerpt: excerpt.trim(),
            writer: writer.trim(),
        });

        const populated = await blog.populate('category', 'name slug');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/blogs
// @desc    Get all blog posts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find({}).sort({ createdAt: -1 }).populate('category', 'name slug');
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/blogs/:id
// @desc    Get single blog post by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid blog ID.' });
        }
        const blog = await Blog.findById(req.params.id).populate('category', 'name slug');
        if (blog) {
            res.json(blog);
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog post
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid blog ID.' });
        }

        const { image, title, category, excerpt, writer } = req.body;

        // Validate category if provided
        if (category !== undefined && !mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ message: 'A valid category must be selected.' });
        }

        const blog = await Blog.findById(req.params.id);

        if (blog) {
            blog.image   = image   || blog.image;
            blog.title   = title   ? title.trim()   : blog.title;
            blog.category = (category && mongoose.Types.ObjectId.isValid(category)) ? category : blog.category;
            blog.excerpt = excerpt ? excerpt.trim() : blog.excerpt;
            blog.writer  = writer  ? writer.trim()  : blog.writer;

            const updatedBlog = await blog.save();
            const populated = await updatedBlog.populate('category', 'name slug');
            res.json(populated);
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/blogs/:id
// @desc    Delete a blog post
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid blog ID.' });
        }

        const blog = await Blog.findById(req.params.id);

        if (blog) {
            await blog.deleteOne();
            res.json({ message: 'Blog removed' });
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
