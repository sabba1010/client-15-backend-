const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/blogs
// @desc    Create a new blog post
// @access  Private/Admin
router.post('/', async (req, res) => {
    try {
        const { image, title, category, excerpt, writer } = req.body;

        // Create blog
        const blog = await Blog.create({
            image,
            title,
            category,
            excerpt,
            writer
        });

        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/blogs
// @desc    Get all blog posts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find({}).populate('category', 'name slug');
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
        const { image, title, category, excerpt, writer } = req.body;
        
        const blog = await Blog.findById(req.params.id);

        if (blog) {
            blog.image = image || blog.image;
            blog.title = title || blog.title;
            blog.category = category || blog.category;
            blog.excerpt = excerpt || blog.excerpt;
            blog.writer = writer || blog.writer;

            const updatedBlog = await blog.save();
            res.json(updatedBlog);
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
