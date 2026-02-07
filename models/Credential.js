const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
    issuerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    holderDID: { type: String, required: true },
    encryptedData: { type: String, required: true }, // AES encrypted JSON string
    blockchainHash: { type: String, required: true }, // The fingerprint on the chain
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    txHash: { type: String } // Transaction ID from blockchain
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);