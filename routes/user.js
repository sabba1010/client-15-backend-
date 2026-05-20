const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, name, email, password, role } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Fallback if frontend sends `name` instead of `firstName`/`lastName`
        let fName = firstName || (name ? name.trim().split(' ')[0] : '');
        let lName = lastName || (name ? name.trim().split(' ').slice(1).join(' ') : '');

        // Ensure both names are non-empty
        if (!fName) fName = 'User';
        if (!lName) lName = 'Account'; // Fallback to prevent empty lastName

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            firstName: fName,
            lastName: lName,
            email,
            password,
            role: role || 'user',
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: `${user.firstName} ${user.lastName}`, // For backwards compatibility
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
});

// @route   POST /api/users/login
// @desc    Authenticate a user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                name: `${user.firstName} ${user.lastName}`, // For backwards compatibility
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;
            user.city = req.body.city || user.city;
            user.state = req.body.state || user.state;
            user.postcode = req.body.postcode || user.postcode;
            user.profileImage = req.body.profileImage || user.profileImage;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                name: `${updatedUser.firstName} ${updatedUser.lastName}`,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                address: updatedUser.address,
                city: updatedUser.city,
                state: updatedUser.state,
                postcode: updatedUser.postcode,
                profileImage: updatedUser.profileImage
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/profile/password
// @desc    Update user password
// @access  Private
router.put('/profile/password', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const { currentPassword, newPassword } = req.body;
            
            // Check if current password matches
            if (await user.matchPassword(currentPassword)) {
                user.password = newPassword;
                await user.save();
                res.json({ message: 'Password updated successfully' });
            } else {
                res.status(401).json({ message: 'Current password is incorrect' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/saved
// @desc    Get user's saved businesses
// @access  Private
router.get('/saved', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('savedBusinesses');
        if (user) {
            res.json(user.savedBusinesses);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/saved/:businessId
// @desc    Save a business to user's favorites
// @access  Private
router.post('/saved/:businessId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { businessId } = req.params;

        if (user) {
            if (!user.savedBusinesses.includes(businessId)) {
                user.savedBusinesses.push(businessId);
                await user.save();
            }
            res.json(user.savedBusinesses);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/users/saved/:businessId
// @desc    Remove a business from user's favorites
// @access  Private
router.delete('/saved/:businessId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { businessId } = req.params;

        if (user) {
            user.savedBusinesses = user.savedBusinesses.filter(
                (id) => id.toString() !== businessId
            );
            await user.save();
            res.json(user.savedBusinesses);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        // Add full name for backward compatibility if needed by frontend
        const usersMapped = users.map(u => ({
            ...u.toObject(),
            name: `${u.firstName} ${u.lastName}`
        }));
        res.json(usersMapped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/:id
// @desc    Update a user's role and status
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.role = req.body.role || user.role;
            user.status = req.body.status || user.status;
            
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
