const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
    issuerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    holderDID: { 
        type: String, 
        required: true 
    },
    certificateText: { 
        type: String, 
        required: true 
    },
    certificateFileUrl: { 
        type: String, 
        required: true 
    }, 
    skills: [String],
    blockchainHash: { 
        type: String, 
        required: true, 
        unique: true 
    },
    txHash: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['active', 'revoked'], 
        default: 'active' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Credential', CredentialSchema);