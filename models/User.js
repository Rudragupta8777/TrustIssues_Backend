const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'issuer', 'employer'], required: true },
    did: { type: String, unique: true },
    publicKey: { type: String }
}, { timestamps: true });

// --- THE FIXED HOOK ---
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model('User', UserSchema);