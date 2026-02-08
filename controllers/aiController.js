const Credential = require('../models/Credential'); 
const openai = require('../config/openai');

exports.findBestMatch = async (req, res) => {
    try {
        const { studentDID, jobRole } = req.body;

        if (!studentDID || !jobRole) {
            return res.status(400).json({ message: "Student DID and Job Role are required." });
        }

        // 2. Fetch Student's Credentials
        // 👇 CHANGED: Use Credential.find()
        const credentials = await Credential.find({ 
            holderDID: studentDID, 
            status: 'active' 
        });

        if (!credentials || credentials.length === 0) {
            return res.status(404).json({ message: "No active credentials found for this student." });
        }

        // 3. Prepare Data for AI
        const certList = credentials.map(cert => ({
            id: cert._id,
            title: cert.certificateText.substring(0, 100),
            fullText: cert.certificateText,
            date: cert.createdAt
        }));

        // 4. Construct the AI Prompt
        const prompt = `
            You are an expert technical recruiter. 
            I am hiring for the role: "${jobRole}".
            
            Here is the portfolio of credentials for a candidate:
            ${JSON.stringify(certList)}

            TASK:
            Analyze the credentials and identify the SINGLE best credential that proves they are fit for this role.
            If no credential is a direct match, pick the one that shows the most relevant transferable skill.

            OUTPUT FORMAT:
            Return ONLY a valid JSON object. Do not include markdown.
            {
                "bestMatchId": "id_from_list",
                "matchScore": 85,
                "reasoning": "Concise explanation."
            }
        `;

        // 5. Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", 
            messages: [
                { role: "system", content: "You are a helpful hiring assistant that outputs strict JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
        });

        // 6. Parse Response
        let aiData;
        try {
            const cleanContent = completion.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
            aiData = JSON.parse(cleanContent);
        } catch (parseError) {
            return res.status(500).json({ message: "AI response processing failed." });
        }

        // 7. Get Full Credential Object
        const bestCert = credentials.find(c => c._id.toString() === aiData.bestMatchId);

        res.status(200).json({
            status: 'success',
            matchFound: true,
            jobRole: jobRole,
            analysis: {
                score: aiData.matchScore,
                reasoning: aiData.reasoning
            },
            certificate: bestCert || credentials[0]
        });

    } catch (error) {
        console.error("AI Match Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};