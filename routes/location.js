const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { protect, admin } = require('../middleware/auth');

// @route   POST /api/locations
// @desc    Create a new location
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { city, region } = req.body;

        // Create location
        const location = await Location.create({
            city,
            region
        });

        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/locations
// @desc    Get all locations
// @access  Public
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find({});
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/locations/:id
// @desc    Get single location by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (location) {
            res.json(location);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/locations/:id
// @desc    Update a location
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { city, region } = req.body;
        
        const location = await Location.findById(req.params.id);

        if (location) {
            location.city = city || location.city;
            location.region = region || location.region;

            const updatedLocation = await location.save();
            res.json(updatedLocation);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/locations/:id
// @desc    Delete a location
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);

        if (location) {
            await location.deleteOne();
            res.json({ message: 'Location removed' });
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
