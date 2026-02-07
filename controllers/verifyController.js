const Credential = require('../models/Credential');
const blockchainService = require('../services/blockchainService');
const { decrypt } = require('../utils/cryptoHandler');
const crypto = require('crypto');

exports.verifyCertificate = async (req, res) => {
    try {
        const { certificateData } = req.body; // The JSON file content

        // 1. Verify Integrity (Blockchain Check)
        const certHash = crypto.createHash('sha256').update(JSON.stringify(certificateData)).digest('hex');
        const isValidOnChain = await blockchainService.verifyHash(certHash);

        if (!isValidOnChain) {
            return res.status(400).json({ status: "invalid", message: "Certificate tampered or not found on blockchain." });
        }

        // 2. Fetch from DB to check Revocation Status
        const record = await Credential.findOne({ blockchainHash: certHash });
        if (!record || record.status === 'revoked') {
            return res.status(400).json({ status: "revoked", message: "Certificate has been revoked by the issuer." });
        }

        res.status(200).json({ 
            status: "verified", 
            message: "Authenticity Guaranteed",
            details: certificateData 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};