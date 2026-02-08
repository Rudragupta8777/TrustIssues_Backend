const Credential = require('../models/Credential');
const User = require('../models/User');

exports.getStudentPortfolio = async (req, res) => {
    try {
        const { studentDID } = req.body;

        if (!studentDID) {
            return res.status(400).json({ message: "Student DID is required" });
        }

        // 1. Fetch Student Details (Optional, for name)
        const student = await User.findOne({ did: studentDID, role: 'student' }).select('name email');

        // 2. Fetch Active Certificates
        const certificates = await Credential.find({ 
            holderDID: studentDID, 
            status: 'active',
            isVisible: true // Only show what student allowed
        }).sort({ createdAt: -1 });

        if (!certificates.length) {
            return res.status(404).json({ message: "No public certificates found for this student." });
        }

        res.status(200).json({
            status: 'success',
            student: student || { name: "Unknown Student" },
            certificates
        });

    } catch (error) {
        console.error("Portfolio Fetch Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};