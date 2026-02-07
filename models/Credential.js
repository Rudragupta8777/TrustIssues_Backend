const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
    // ... existing fields
    issuerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    holderDID: { type: String, required: true },
    certificateText: { type: String, required: true },
    certificateFileUrl: { type: String, required: true },
    skills: [String],
    blockchainHash: { type: String, required: true, unique: true },
    txHash: { type: String, required: true },
    
    // NEW FIELD: Privacy Control
    isVisible: { type: Boolean, default: true }, // Default to true for better UX, or false for strict privacy
    
    status: { type: String, enum: ['active', 'revoked'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);