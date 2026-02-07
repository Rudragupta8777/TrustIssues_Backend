const { ethers } = require('ethers');
const blockchainService = require('../services/blockchainService');
const Credential = require('../models/Credential');

exports.verifyCertificate = async (req, res) => {
    try {
        const { certificateData } = req.body; 

        // 1. Generate hash from the provided data
        const hash = ethers.id(JSON.stringify(certificateData));

        // 2. Real-time Blockchain Verification
        const isValid = await blockchainService.verifyHash(hash);

        if (!isValid) {
            return res.status(401).json({
                status: "invalid",
                message: "Certificate not found on blockchain or has been revoked."
            });
        }

        // 3. Check internal database for extra details
        const record = await Credential.findOne({ blockchainHash: hash });

        res.status(200).json({
            status: "verified",
            blockchainConfirmed: true,
            data: certificateData,
            dbRecord: record ? "Record Found" : "Off-platform Credential"
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};