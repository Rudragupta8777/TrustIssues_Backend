const Credential = require('../models/Credential');

/**
 * @desc    Get all certificates belonging to the logged-in Student
 * @route   GET /api/v1/student/dashboard
 */
exports.getStudentDashboard = async (req, res) => {
    try {
        // 1. Get the DID of the logged-in user
        const myDID = req.user.did;

        console.log(`🔍 Searching for certificates for holder: ${myDID}`);

        // 2. Find credentials where holderDID matches
        const certificates = await Credential.find({ holderDID: myDID })
            .populate('issuerId', 'name email') // Get Issuer details
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json({
            status: "success",
            count: certificates.length,
            data: certificates
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * @desc    Toggle Privacy (Show/Hide from Employer)
 * @route   PATCH /api/v1/student/toggle-share/:id
 */
exports.toggleVisibility = async (req, res) => {
    try {
        const certificate = await Credential.findById(req.params.id);

        if (!certificate) return res.status(404).json({ message: "Not Found" });

        // Security: Ensure only the owner can toggle
        if (certificate.holderDID !== req.user.did) {
            return res.status(403).json({ message: "You do not own this certificate!" });
        }

        certificate.isVisible = !certificate.isVisible;
        await certificate.save();

        res.status(200).json({
            status: "success",
            isVisible: certificate.isVisible
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};