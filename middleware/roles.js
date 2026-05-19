// Additional role guards — import alongside protect from auth.js
// Usage: router.put('/:id', protect, selfOrAdmin, handler)
//        router.post('/',   protect, tradie,      handler)

const tradie = (req, res, next) => {
    if (req.user && (req.user.role === 'tradie' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a tradie' });
    }
};

// Allows a user to access their own resource OR an admin to access any
const selfOrAdmin = (req, res, next) => {
    if (
        req.user &&
        (req.user.role === 'admin' || req.user._id.toString() === req.params.id)
    ) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized to access this resource' });
    }
};

module.exports = { tradie, selfOrAdmin };
