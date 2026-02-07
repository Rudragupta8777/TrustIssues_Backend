const blockchainService = require('../services/blockchainService');
const Credential = require('../models/Credential');

/**
 * @desc    Verify certificate using its Blockchain Hash
 * @route   GET /api/v1/employer/verify/:hash
 * @access  Public
 */
exports.verifyCertificate = async (req, res) => {
    try {
        const { hash } = req.params;

        // --- 1. INSTANT BLOCKCHAIN CHECK (The "Truth") ---
        // This checks the Smart Contract: "Does this hash exist and is it active?"
        const isValid = await blockchainService.verifyHash(hash);

        if (!isValid) {
            return res.status(404).json({
                status: "invalid",
                message: "Certificate not found on blockchain or has been revoked."
            });
        }

        // --- 2. DATABASE LOOKUP (The "Details") ---
        // We look for the human-readable data associated with this hash
        const record = await Credential.findOne({ blockchainHash: hash })
            .populate('issuerId', 'name email');

        // --- 3. PRIVACY CHECK (The "Shield") ---
        // If the student has toggled "Hide" in their app, we block the data here.
        if (record && !record.isVisible) {
            return res.status(200).json({
                status: "verified_private",
                message: "Certificate is VALID and ACTIVE on the Blockchain, but the holder has chosen to keep the details private.",
                blockchainConfirmed: true,
                data: null, // Hides the Image, Skills, and Text
                blockchainDetails: {
                    explorerUrl: `https://amoy.polygonscan.com/address/${process.env.CONTRACT_ADDRESS}`
                }
            });
        }

        // --- 4. FETCH EXTRA BLOCKCHAIN DATA ---
        // Only fetch strictly necessary blockchain timestamp info if we are showing the cert
        // (Note: You might need to handle the case where 'contract' access fails gracefully)
        let blockchainInfo = {};
        try {
            const info = await blockchainService.contract.getCertificateInfo(hash);
            blockchainInfo = {
                issueDate: new Date(Number(info.timestamp) * 1000),
                issuerWallet: info.issuer,
                revoked: info.revoked
            };
        } catch (err) {
            console.warn("Could not fetch extra contract info, proceeding with DB data.");
        }

        // --- 5. RETURN FULL VERIFIED DATA ---
        res.status(200).json({
            status: "verified",
            blockchainConfirmed: true,
            data: record || "Off-platform Credential (No local data found)",
            blockchainDetails: {
                ...blockchainInfo,
                explorerUrl: `https://amoy.polygonscan.com/tx/${record ? record.txHash : ''}`
            }
        });

    } catch (error) {
        console.error("Verification Route Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};