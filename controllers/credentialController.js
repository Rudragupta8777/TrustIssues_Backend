const axios = require('axios');
const { ethers } = require('ethers');
const Credential = require('../models/Credential');
const blockchainService = require('../services/blockchainService');
const { encrypt } = require('../utils/cryptoHandler');

exports.issueCredential = async (req, res) => {
    try {
        const { studentDID, certificateText } = req.body;

        // 1. Validate certificate text with AI Service
        const aiBaseUrl = process.env.AI_SERVICE_URL;
        const validation = await axios.post(`${aiBaseUrl}/api/validate-certificate`, {
            text: certificateText
        });

        if (!validation.data.is_valid) {
            return res.status(400).json({
                status: "error",
                message: "AI Validation failed",
                suggestions: validation.data.suggestions
            });
        }

        // 2. Extract skills using AI
        const skillData = await axios.post(`${aiBaseUrl}/api/extract-skills`, {
            text: certificateText
        });

        // 3. Prepare Certificate Data
        const certificatePayload = {
            issuerDID: req.user.did,
            holderDID: studentDID,
            text: certificateText,
            skills: skillData.data.skills,
            issueDate: new Date().toISOString()
        };

        // 4. Generate Hash (Ethers id creates a Keccak256 hash)
        const hash = ethers.id(JSON.stringify(certificatePayload));

        // 5. Anchor to Blockchain
        const blockchainResult = await blockchainService.anchorCertificate(hash);

        // 6. Encrypt and Save to DB
        const secureData = encrypt(JSON.stringify(certificatePayload));
        const credential = await Credential.create({
            issuerId: req.user._id,
            holderDID: studentDID,
            encryptedData: secureData,
            blockchainHash: hash,
            txHash: blockchainResult.txHash,
            status: 'active'
        });

        res.status(201).json({
            status: "success",
            blockchain: {
                hash: hash,
                txHash: blockchainResult.txHash,
                explorer: `https://amoy.polygonscan.com/tx/${blockchainResult.txHash}`
            },
            data: credential
        });

    } catch (error) {
        console.error("Issuance Flow Error:", error);
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