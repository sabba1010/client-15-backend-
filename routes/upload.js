const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// @route   POST /api/upload/image
// @desc    Upload a single image (profile pic, cover, gallery)
// @access  Private
router.post('/image', protect, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Build a URL the frontend can use
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.status(201).json({
            message: 'Image uploaded successfully',
            filename: req.file.filename,
            url: fileUrl,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/upload/images
// @desc    Upload multiple images (up to 10 at once)
// @access  Private
router.post('/images', protect, upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }

        const files = req.files.map((file) => ({
            filename: file.filename,
            url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        }));

        res.status(201).json({
            message: `${files.length} image(s) uploaded successfully`,
            files,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
