const SavedCandidate = require('../models/SavedCandidate');
const Credential = require('../models/Credential');
const User = require('../models/User');
const openai = require('../config/openai'); 

// 1. Save Candidate (Standard logic)
exports.saveCandidate = async (req, res) => {
    try {
        const { studentDID } = req.body;
        const employerId = req.user.id;

        // 1. Find the Student in the User Database
        const studentUser = await User.findOne({ did: studentDID });

        // 2. Determine the Name (Use real name if found, else "Unknown")
        const realName = studentUser ? studentUser.name : "Unknown Student";

        // 3. Save or Update in Employer's Pool
        await SavedCandidate.findOneAndUpdate(
            { employerId, studentDID },
            { 
                studentName: realName, // 👈 Saves the REAL Name
                savedAt: Date.now() 
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ 
            status: "success", 
            message: "Candidate Saved", 
            studentName: realName 
        });

    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Get My Pool (Standard logic)
exports.getMyPool = async (req, res) => {
    try {
        // 1. Get all saved students
        const savedCandidates = await SavedCandidate.find({ employerId: req.user.id }).sort({ savedAt: -1 });

        // 2. Get DIDs
        const dids = savedCandidates.map(s => s.studentDID);

        // 3. Fetch ALL active certificates for these students
        const certificates = await Credential.find({
            holderDID: { $in: dids },
            status: 'active',
            isVisible: true
        });

        // 4. Merge data (Add "certificateCount" or full list to each student)
        const data = savedCandidates.map(candidate => {
            const studentCerts = certificates.filter(c => c.holderDID === candidate.studentDID);
            return {
                ...candidate._doc, // Spread the mongoose document
                certificateCount: studentCerts.length, // Show how many they have
                latestCertificate: studentCerts[0]?.certificateText.substring(0, 50) || "No certs yet"
            };
        });

        res.status(200).json({ status: "success", data: data });
    } catch (error) {
        console.error("Pool Error:", error);
        res.status(500).json({ message: "Error fetching pool" });
    }
};

// 3. AI Search - THE FIX YOU ASKED FOR
// controllers/recruiterController.js

exports.aiSearchPool = async (req, res) => {
    try {
        const { jobRole } = req.body;
        const employerId = req.user.id;

        // 1. Get Saved Candidates
        const savedStudents = await SavedCandidate.find({ employerId });
        if (!savedStudents.length) {
            return res.status(404).json({ message: "Pool empty. Scan a student first!" });
        }

        // 2. Remove Duplicates (Fixing the log issue)
        // We use a Map to ensure each Student DID appears only once
        const uniqueStudents = new Map();
        savedStudents.forEach(s => uniqueStudents.set(s.studentDID, s.studentName));
        
        const dids = Array.from(uniqueStudents.keys());

        // 3. Fetch Certificates
        const allCertificates = await Credential.find({
            holderDID: { $in: dids },
            status: 'active',
            isVisible: true
        });

        // 4. Prepare Data for AI
        const candidatesData = [];
        dids.forEach(did => {
            const studentCerts = allCertificates.filter(c => c.holderDID === did);
            if (studentCerts.length > 0) {
                candidatesData.push({
                    studentName: uniqueStudents.get(did),
                    studentDID: did,
                    credentials: studentCerts.map(c => ({
                        id: c._id,
                        skills: c.skills || [], 
                        text: c.certificateText.substring(0, 500) 
                    }))
                });
            }
        });

        // 5. Prompt
        const prompt = `
            I am a strict recruiter hiring for: "${jobRole}".
            Here are the candidates: ${JSON.stringify(candidatesData)}

            TASK:
            Rank candidates based on skills/text matching the role.
            Output a JSON ARRAY. Even if there is only 1 match, wrap it in [ ... ].

            OUTPUT FORMAT:
            [
                { "rank": 1, "studentName": "Name", "matchScore": 85, "bestCertificateId": "id", "reason": "..." }
            ]
        `;

        // 6. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
        });

        // 7. Parse & SAFELY HANDLE RESPONSE
        let results;
        try {
            const cleanContent = completion.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
            results = JSON.parse(cleanContent);

            // 🚨 CRITICAL FIX: Force it to be an Array
            if (!Array.isArray(results)) {
                // If AI returned a single object { ... }, wrap it in [ { ... } ]
                results = [results];
            }

        } catch (parseError) {
            console.error("AI Parse Error:", parseError);
            return res.status(500).json({ message: "AI response error" });
        }

        // 8. Hydrate with Full Certificate Details
        const finalResponse = results.map(r => ({
            ...r,
            certificateDetails: allCertificates.find(c => c._id.toString() === r.bestCertificateId) || null
        }));

        // 9. Send Array to Android
        res.status(200).json({ 
            status: "success", 
            count: finalResponse.length, 
            matches: finalResponse // ✅ This is now GUARANTEED to be an Array
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};