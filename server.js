require('dotenv').config(); // MUST BE LINE 1

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const issuerRoutes = require('./routes/issuerRoutes');
const employerRoutes = require('./routes/employerRoutes');

// Connect Database
connectDB();

const app = express();


app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/issuer', issuerRoutes);
app.use('/api/v1/employer', employerRoutes);


app.get('/health', (req, res) => res.status(200).json({ status: "OK" }));

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ status: "error", message: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error("🔥 SYSTEM ERROR:", err.stack);
    res.status(err.status || 500).json({ 
        status: "error", 
        message: err.message || "Internal Server Error" 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 TrustIssues Server running on Port ${PORT}`));