const { ethers } = require('ethers');
const contractABI = require('../config/CertificateRegistry.abi.json');

class BlockchainService {
    constructor() {
        // Validation with immediate logging
        let pKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : null;

        if (!pKey) {
            console.error("❌ ERROR: PRIVATE_KEY is missing. Check if .env is in the root folder.");
            return; // Don't crash immediately, allow the app to log the error properly
        }

        if (!pKey.startsWith('0x')) {
            pKey = `0x${pKey}`;
        }

        try {
            this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
            this.wallet = new ethers.Wallet(pKey, this.provider);
            this.contract = new ethers.Contract(
                process.env.CONTRACT_ADDRESS,
                contractABI,
                this.wallet
            );

            console.log(`✅ Blockchain Service Connected`);
        } catch (error) {
            console.error("❌ Blockchain Init Failed:", error.message);
        }
    }

    async anchorCertificate(hash) {
        try {
            const tx = await this.contract.anchorHash(hash);
            const receipt = await tx.wait();
            return { success: true, txHash: receipt.hash };
        } catch (error) {
            console.error("Blockchain Anchor Error:", error);
            throw new Error(error.message);
        }
    }

    async verifyHash(hash) {
        try {
            return await this.contract.verifyHash(hash);
        } catch (error) {
            return false;
        }
    }

    async revokeHash(hash) {
        try {
            const tx = await this.contract.revokeHash(hash);
            await tx.wait();
            return true;
        } catch (error) {
            throw new Error("Revocation failed");
        }
    }
}

module.exports = new BlockchainService();