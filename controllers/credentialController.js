const axios = require('axios');
const crypto = require('crypto');
const Credential = require('../models/Credential');
const blockchainService = require('../services/blockchainService');
const { encrypt } = require('../utils/cryptoHandler');

/**
 * @desc    Issue a new verifiable credential
 * @route   POST /api/v1/credentials/issue
 * @access  Private (Issuer Only)
 */
exports.issueCredential = async (req, res) => {
    try {
        const { studentDID, rawData, skillName } = req.body;

        // 1. AI Analysis (Call your friend's Python Service)
        // This ensures the skill being issued is verified by AI logic
        let aiVerifiedSkills = [];
        try {
            const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/extract`, { 
                content: rawData 
            });
            aiVerifiedSkills = aiResponse.data.skills;
        } catch (aiErr) {
            console.error("AI Service Error:", aiErr.message);
            // Fallback: If AI is down, we can log it but continue if admin overrides
        }

        // 2. Construct the Plain Credential JSON
        const credentialPayload = {
            issuerDID: req.user.did,
            holderDID: studentDID,
            skill: skillName || aiVerifiedSkills[0],
            issuanceDate: new Date().toISOString(),
            platform: "TrustIssues"
        };

        const payloadString = JSON.stringify(credentialPayload);

        // 3. Hashing for Blockchain (Public Fingerprint)
        const certHash = crypto.createHash('sha256').update(payloadString).digest('hex');

        // 4. Encrypting for Database (Hushed Data)
        const encryptedData = encrypt(payloadString);

        // 5. Anchor to Blockchain (Your Friend's Smart Contract)
        const blockchainTx = await blockchainService.anchorCertificate(certHash);

        // 6. Save Secure Record to MongoDB
        const credential = await Credential.create({
            issuerId: req.user._id,
            holderDID: studentDID,
            encryptedData: encryptedData, // Stored Encrypted
            blockchainHash: certHash,     // Stored as Hash
            txHash: blockchainTx.txHash,
            status: 'active'
        });

        res.status(201).json({
            status: "success",
            message: "Credential issued and anchored to blockchain",
            data: {
                credentialId: credential._id,
                blockchainHash: certHash,
                transactionId: blockchainTx.txHash
            }
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

/**
 * @desc    Revoke a credential (updates Blockchain and DB)
 */
exports.revokeCredential = async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id);

        if (!credential) return res.status(404).json({ message: "Credential not found" });

        // Update Blockchain
        await blockchainService.revokeHash(credential.blockchainHash);

        // Update Local DB
        credential.status = 'revoked';
        await credential.save();

        res.status(200).json({ status: "success", message: "Credential revoked successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all credentials issued by the logged-in Institute
 */
exports.getMyIssuedCredentials = async (req, res) => {
    try {
        const list = await Credential.find({ issuerId: req.user._id });
        res.status(200).json({ status: "success", count: list.length, data: list });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};