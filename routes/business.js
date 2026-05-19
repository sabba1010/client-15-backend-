const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const { protect, admin } = require('../middleware/auth');
const { tradie } = require('../middleware/roles');

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

// @route   GET /api/businesses
// @desc    Get all approved businesses (public listing / find-a-pro page)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, location, search } = req.query;
        const filter = { status: 'approved' };

        if (category) filter.category = { $regex: category, $options: 'i' };
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (search) {
            filter.$or = [
                { businessName: { $regex: search, $options: 'i' } },
                { servicesOffered: { $regex: search, $options: 'i' } },
                { suburb: { $regex: search, $options: 'i' } },
            ];
        }

        const businesses = await Business.find(filter).populate('owner', 'name email');
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/businesses/:id
// @desc    Get a single business by ID (public)
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const business = await Business.findById(req.params.id).populate('owner', 'name email');
        if (!business) return res.status(404).json({ message: 'Business not found' });
        res.json(business);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── TRADIE (own listings) ────────────────────────────────────────────────────

// @route   GET /api/businesses/my/listings
// @desc    Get all businesses owned by the logged-in tradie
// @access  Private/Tradie
router.get('/my/listings', protect, tradie, async (req, res) => {
    try {
        const businesses = await Business.find({ owner: req.user._id });
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/businesses
// @desc    Create a new business listing
// @access  Private/Tradie
router.post('/', protect, tradie, async (req, res) => {
    try {
        const {
            businessName, abn, category, location, suburb,
            servicesOffered, website, yearsInBusiness,
            shortDescription, longDescription,
            contactPhone, contactEmail, logo, coverImage, tags, experience,
        } = req.body;

        if (!businessName || !category || !location) {
            return res.status(400).json({ message: 'businessName, category and location are required' });
        }

        const business = await Business.create({
            owner: req.user._id,
            businessName, abn, category, location, suburb,
            servicesOffered, website, yearsInBusiness,
            shortDescription, longDescription,
            contactPhone, contactEmail, logo, coverImage, tags, experience,
            status: 'pending',
        });

        res.status(201).json(business);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/businesses/:id
// @desc    Update a business listing (owner or admin)
// @access  Private/Tradie
router.put('/:id', protect, tradie, async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);
        if (!business) return res.status(404).json({ message: 'Business not found' });

        // Only owner or admin can edit
        if (business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to edit this listing' });
        }

        // Prevent tradie from changing status themselves
        const { status, owner, ...updateData } = req.body;

        const updated = await Business.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/businesses/:id
// @desc    Delete a business listing (owner or admin)
// @access  Private/Tradie
router.delete('/:id', protect, tradie, async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);
        if (!business) return res.status(404).json({ message: 'Business not found' });

        if (business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this listing' });
        }

        await business.deleteOne();
        res.json({ message: 'Business listing deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/businesses/:id/gallery
// @desc    Add an image to a business gallery
// @access  Private/Tradie
router.post('/:id/gallery', protect, tradie, async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);
        if (!business) return res.status(404).json({ message: 'Business not found' });

        if (business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { url, title } = req.body;
        if (!url) return res.status(400).json({ message: 'Image url is required' });

        business.gallery.push({ url, title: title || '' });
        await business.save();
        res.json(business.gallery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/businesses/:id/gallery/:imageId
// @desc    Remove an image from a business gallery
// @access  Private/Tradie
router.delete('/:id/gallery/:imageId', protect, tradie, async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);
        if (!business) return res.status(404).json({ message: 'Business not found' });

        if (business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        business.gallery = business.gallery.filter(
            (img) => img._id.toString() !== req.params.imageId
        );
        await business.save();
        res.json(business.gallery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────

// @route   GET /api/businesses/admin/all
// @desc    Get all businesses with any status (for admin dashboard)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const businesses = await Business.find(filter)
            .populate('owner', 'name email role')
            .sort({ createdAt: -1 });
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PATCH /api/businesses/:id/status
// @desc    Approve or reject a business listing
// @access  Private/Admin
router.patch('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be pending, approved or rejected' });
        }

        const business = await Business.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!business) return res.status(404).json({ message: 'Business not found' });
        res.json(business);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
