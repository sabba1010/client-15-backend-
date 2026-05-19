const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve uploaded images statically (only for local development)
if (process.env.NODE_ENV !== 'production') {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const locationRoutes = require('./routes/location');
const blogRoutes = require('./routes/blog');
const businessRoutes = require('./routes/business');
const statsRoutes    = require('./routes/stats');
const uploadRoutes   = require('./routes/upload');


app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/stats',      statsRoutes);
app.use('/api/upload',     uploadRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
