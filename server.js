const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const credentialRoutes = require('./routes/credentialRoutes');

// Initialize Environment
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// --- SECURITY MIDDLEWARE ---
app.use(helmet());
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later."
});
app.use('/api', globalLimiter);

// --- ROUTES ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/credentials', credentialRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: "OK", timestamp: new Date() }));

// --- THE FIX: CATCH-ALL ROUTE ---
// Using .use() without a path acts as a catch-all for anything 
// that didn't match the routes above.
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        status: "error", 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : {} 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 TrustIssues Secure Server running on port ${PORT}`);
});