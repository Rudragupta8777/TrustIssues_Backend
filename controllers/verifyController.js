const blockchainService = require('../services/blockchainService');
const Credential = require('../models/Credential');


exports.verifyCertificate = async (req, res) => {
    try {
        const { hash } = req.params;

        // 1. Instant Blockchain Check (Read-only, Free)
        const isValid = await blockchainService.verifyHash(hash);

        if (!isValid) {
            return res.status(404).json({
                status: "invalid",
                message: "Certificate not found on blockchain or has been revoked."
            });
        }

        // 2. Get Details from Smart Contract
        // We use the 'contract' instance directly from the service
        const info = await blockchainService.contract.getCertificateInfo(hash);

        // 3. Get Human-Readable Data from MongoDB
        const certificate = await Credential.findOne({ blockchainHash: hash })
            .populate('issuerId', 'name email');

        // 4. Return Combined Response
        res.status(200).json({
            status: "verified",
            blockchainConfirmed: true,
            data: certificate,
            blockchainDetails: {
                issueDate: new Date(Number(info.timestamp) * 1000),
                issuerWallet: info.issuer,
                revoked: info.revoked,
                explorerUrl: `https://amoy.polygonscan.com/address/${process.env.CONTRACT_ADDRESS}`
            }
        });

    } catch (error) {
        console.error("Verification Route Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};