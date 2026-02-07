const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, did, publicKey } = req.body;
        
        // 1. Guard against undefined body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ status: "error", message: "Empty request body" });
        }

        // 2. Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ status: "error", message: "Missing required fields" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ status: "error", message: "User already exists" });
        }

        // 3. Create User
        const user = await User.create({ name, email, password, role, did, publicKey });

        // 4. Token Generation
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // 5. Final Response (Explicitly returned)
        return res.status(201).json({ 
            status: "success", 
            token, 
            data: { user: { id: user._id, name, email, role } } 
        });
    } catch (err) {
        // Log the actual error to your terminal for debugging
        console.error("Registration Error:", err);
        return res.status(500).json({ status: "error", message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({ status: "success", token, data: { name: user.name, role: user.role } });
    } catch (err) {
        return res.status(500).json({ status: "error", message: err.message });
    }
};