const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Business = require('../models/Business');
const Blog = require('../models/Blog');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/stats/admin
// @desc    Get platform-wide stats for the admin overview dashboard
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            totalTradies,
            totalAdmins,
            newUsersThisMonth,
            totalListings,
            pendingListings,
            approvedListings,
            rejectedListings,
            newListingsThisMonth,
            totalBlogs,
            publishedBlogs,
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'tradie' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ createdAt: { $gte: firstOfMonth } }),
            Business.countDocuments({}),
            Business.countDocuments({ status: 'pending' }),
            Business.countDocuments({ status: 'approved' }),
            Business.countDocuments({ status: 'rejected' }),
            Business.countDocuments({ createdAt: { $gte: firstOfMonth } }),
            Blog.countDocuments({}),
            Blog.countDocuments({ isPublished: true }),
        ]);

        // Signups per month for the last 7 months (chart data)
        const signupChart = await buildMonthlyChart(User, 7);

        // Listings by category (pie chart data)
        const categoryBreakdown = await Business.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$category', value: { $sum: 1 } } },
            { $project: { _id: 0, name: '$_id', value: 1 } },
            { $sort: { value: -1 } },
        ]);

        // Listings by location (bar chart data)
        const locationBreakdown = await Business.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$location', value: { $sum: 1 } } },
            { $project: { _id: 0, name: '$_id', value: 1 } },
            { $sort: { value: -1 } },
        ]);

        res.json({
            users: {
                total: totalUsers,
                tradies: totalTradies,
                admins: totalAdmins,
                newThisMonth: newUsersThisMonth,
            },
            listings: {
                total: totalListings,
                pending: pendingListings,
                approved: approvedListings,
                rejected: rejectedListings,
                newThisMonth: newListingsThisMonth,
            },
            blogs: {
                total: totalBlogs,
                published: publishedBlogs,
            },
            charts: {
                signups: signupChart,
                categories: categoryBreakdown,
                locations: locationBreakdown,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── TRADIE STATS ─────────────────────────────────────────────────────────────

// @route   GET /api/stats/tradie
// @desc    Get stats for the logged-in tradie's own listings
// @access  Private
router.get('/tradie', protect, async (req, res) => {
    try {
        const ownerId = req.user._id;

        const [total, approved, pending, rejected] = await Promise.all([
            Business.countDocuments({ owner: ownerId }),
            Business.countDocuments({ owner: ownerId, status: 'approved' }),
            Business.countDocuments({ owner: ownerId, status: 'pending' }),
            Business.countDocuments({ owner: ownerId, status: 'rejected' }),
        ]);

        res.json({ total, approved, pending, rejected });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function buildMonthlyChart(Model, months) {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const count = await Model.countDocuments({
            createdAt: { $gte: d, $lt: next },
        });
        result.push({
            name: d.toLocaleString('default', { month: 'short' }),
            value: count,
        });
    }

    return result;
}

module.exports = router;
