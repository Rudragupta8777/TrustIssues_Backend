const axios = require('axios');
const { ethers } = require('ethers');
const Credential = require('../models/Credential');
const blockchainService = require('../services/blockchainService');

exports.issueCredential = async (req, res) => {
    try {
        const { studentDID, certificateText } = req.body;

        // 1. FILE CHECK
        if (!req.file) {
            return res.status(400).json({ status: "error", message: "Certificate file is required" });
        }
        const fileUrl = req.file.path; // Cloudinary URL

        // 2. AI VALIDATION & EXTRACTION
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

        const skillResponse = await axios.post(`${aiBaseUrl}/api/extract-skills`, {
            text: certificateText
        });
        const extractedSkills = skillResponse.data.skills;

        // 3. HASHING (Including File URL for Integrity)
        const certificatePayload = {
            issuerDID: req.user.did,
            holderDID: studentDID,
            skills: extractedSkills,
            fileUrl: fileUrl, // Now the proof is linked to the image
            issueDate: new Date().toISOString()
        };

        const hash = ethers.id(JSON.stringify(certificatePayload));

        // 4. BLOCKCHAIN ANCHOR
        const blockchainResult = await blockchainService.anchorCertificate(hash);

        // 5. DATABASE STORAGE
        const newCredential = await Credential.create({
            issuerId: req.user._id,
            holderDID: studentDID,
            certificateText: certificateText,
            certificateFileUrl: fileUrl,
            skills: extractedSkills,
            blockchainHash: hash,
            txHash: blockchainResult.txHash
        });

        res.status(201).json({
            status: "success",
            message: "Credential issued and anchored.",
            blockchainHash: hash,
            fileUrl: fileUrl,
            txHash: blockchainResult.txHash
        });

    } catch (error) {
        console.error("Issuance Failure:", error.message);
        res.status(500).json({ status: "error", message: error.message });
    }
};

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


exports.getMyIssuedCredentials = async (req, res) => {
    try {
        const list = await Credential.find({ issuerId: req.user._id });
        res.status(200).json({ status: "success", count: list.length, data: list });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};