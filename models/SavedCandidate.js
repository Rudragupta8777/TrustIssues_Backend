const mongoose = require('mongoose');

const SavedCandidateSchema = new mongoose.Schema({
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentDID: { type: String, required: true },
    studentName: { type: String }, // Cache name for faster loading
    savedAt: { type: Date, default: Date.now }
});

// Prevent duplicate saves of the same student by the same employer
SavedCandidateSchema.index({ employerId: 1, studentDID: 1 }, { unique: true });

module.exports = mongoose.model('SavedCandidate', SavedCandidateSchema);