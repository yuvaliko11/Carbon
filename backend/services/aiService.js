const fs = require('fs');
const pdf = require('pdf-parse');
const OpenAI = require('openai');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const os = require('os');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extracts text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        let text = data.text;
        const cleanText = text ? text.trim() : "";
        console.log(`PDF Text Length: ${text ? text.length : 0}, Trimmed Length: ${cleanText.length}`);

        // Check for common contract keywords to detect garbage text
        const hasKeywords = /lease|agreement|land|fiji/i.test(cleanText);

        // OCR Fallback if text is empty, too short, or missing keywords (likely scanned or garbage)
        if (!text || cleanText.length < 100 || !hasKeywords) {
            console.log("⚠️ PDF text empty, short, or missing keywords. Attempting OCR...");
            try {
                // 1. Convert PDF to Images (first 3 pages to save time)
                const outputPrefix = path.join(os.tmpdir(), `ocr_${Date.now()}`);
                await execPromise(`pdftoppm -png -f 1 -l 3 "${filePath}" "${outputPrefix}"`);

                // 2. Run Tesseract on each image
                const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(path.basename(outputPrefix)) && f.endsWith('.png'));
                let ocrText = "";

                for (const file of files) {
                    const imagePath = path.join(os.tmpdir(), file);
                    const { stdout } = await execPromise(`tesseract "${imagePath}" stdout`);
                    ocrText += stdout + "\n";
                    fs.unlinkSync(imagePath); // Cleanup image
                }

                if (ocrText.trim().length > 0) {
                    console.log("✅ OCR Success. Extracted characters:", ocrText.length);
                    return ocrText;
                }
            } catch (ocrError) {
                console.error("❌ OCR Failed:", ocrError.message);
            }
        }

        return text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
};

/**
 * Analyzes contract text using OpenAI
 * @param {string} text - Contract text
 * @returns {Promise<Object>} - Analyzed data
 */
const analyzeContract = async (text) => {
    if (!text || typeof text !== 'string') {
        console.warn('⚠️ analyzeContract received invalid text:', text);
        return {};
    }
    console.log("AI SERVICE VERSION: 2.1 (Regex Enforced)");
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert legal AI assistant for the Fiji Carbon Hub. Your job is to analyze land lease contracts and extract comprehensive data for carbon project eligibility.
                    
                    Extract the following fields in specific JSON format:

                    {
                        "general": {
                            "leaseNumber": "string (Lease No.)",
                            "fileReference": "string (File Ref)",
                            "leaseType": "string",
                            "regulation": "string",
                            "approvalDate": "string (Date of Approval)",
                            "registrationDate": "string",
                            "registrationTime": "string"
                        },
                        "parties": {
                            "lessor": "string (Name)",
                            "lessorAddress": "string",
                            "lessee": "string (Mataqali Name)",
                            "lesseeOffice": "string (Registered Office)",
                            "lesseeSignatory": "string (Title/Role)",
                            "witness": "string (Title/Role)"
                        },
                        "land": {
                            "name": "string (Land Name)",
                            "owner": "string (Landowning Unit/LOU)",
                            "tikina": "string",
                            "province": "string",
                            "totalArea": "string (e.g. 621.486 ha)",
                            "map identification": "string (e.g. edges in YELLOW)",
                            "tokatoka": "string",
                            "tlcLot": "string",
                            "sheetRef": "string",
                            "finalReport": "string",
                            "parcelAreas": ["string", "string"],
                            "infrastructure": "string (Roads etc.)"
                        },
                        "financial": {
                            "initialConsideration": "number (0 if Nil)",
                            "annualRent": "number (The recurring yearly rent, e.g. 2000)",
                            "rentDueDate": "string",
                            "rentReassessment": "string",
                            "adminFee": "number",
                            "feeAdjustment": "string"
                        },
                        "term": {
                            "startDate": "string (YYYY-MM-DD)",
                            "durationYears": "number (e.g. 50)"
                        },
                        "covenants": [
                            "string (Payment)",
                            "string (Use)",
                            "string (Taxes)",
                            "string (Compliance)",
                            "string (Indemnity)",
                            "string (Nuisance)",
                            "string (Right of Entry)",
                            "string (Electricity)",
                            "string (Development Consent)"
                        ],
                        "specialConditions": {
                            "salesWithImprovements": "string (20% yr 1-10, 10% yr 11+)",
                            "salesNoImprovements": "string (25% yr 1-10, 10% yr 11+)",
                            "mortgageeSale": "string",
                            "valuation": "string (Intangible Values)",
                            "carbonTrading": "string (Discussions on participation)",
                            "revenueSharing": "string",
                            "thirdPartyProceeds": "string",
                            "disputeResolution": "string"
                        },
                        "mapData": {
                            "scale": "string",
                            "date": "string",
                            "preparedBy": "string",
                            "unit": "string"
                        },
                        "analysis": {
                            "greenScore": "number (0-100)",
                            "status": "string (compliant/warning/breach)",
                            "location": "GeoJSON Polygon Object"
                        }
                    }

                    **CRITICAL RULES**:
                    1. **Rent**: Look for "Yearly Rent", "Annual Rent", or "Yielding and Paying". 
                    2. **Mataqali Name**: Capture the full name of the Lessee if they are a landowning unit company.
                    3. **Date Parsing**: Convert dates to standard formats where possible.
                    4. **Green Score** (CRITICAL):
                        - **Score < 40** (Breach) if term < 10 years.
                        - **Score < 60** (Warning) if term < 30 years.
                        - **Score 90-100** (Compliant) if term >= 50 years OR conservation purpose.
                        - **Score 60-89** (Compliant/Warning) if term is 30-49 years.
                    5. **ExtractedData**: The structure above MUST be followed.
                    6. **Missing Data**: For specific Fiji fields (Tokatoka, TLC Lot), if not found, set to null (do not return empty string).`
                },
                {
                    role: "user",
                    content: `Analyze this contract text: \n\n${text.substring(0, 15000)}` // Limit text length
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // Normalize data for the flat model (Backward Compatibility + Core Fields)
        const flatResult = {
            leaseNumber: result.general?.leaseNumber || null,
            mataqaliName: result.land?.owner || result.parties?.lessee || null,
            termYears: result.term?.durationYears || null,
            annualRentAmount: result.financial?.annualRent || null,
            greenScore: result.analysis?.greenScore || 0,
            status: result.analysis?.status || 'warning',
            location: result.analysis?.location || null,
            extractedData: result // Store the FULL rich data here
        };

        // --- FALLBACK: Regex for Mataqali if AI missed it ---
        if (!flatResult.mataqaliName || flatResult.mataqaliName === 'N/A') {
            console.log("AI missed Mataqali, trying regex fallback...");
            const mataqaliRegex = /(?:MATAQALI|YAVUSA|TOKATOKA)\s+([A-Z\s]+)(?:HOLDINGS|PTE|LIMITED)?/i;
            const match = text.match(mataqaliRegex);
            if (match) {
                // Clean up the name
                let name = match[0].trim();
                // Remove common suffixes if captured excessively
                name = name.replace(/HOLDINGS\s+PTE\s+LIMITED/i, '').trim();
                flatResult.mataqaliName = name;
                console.log(`Regex found Mataqali: ${flatResult.mataqaliName}`);
            }
        }

        // --- REGEX CHECK FOR RENT (Validation / Fallback) ---
        console.log("Running regex check for rent...");

        // Tighter regex patterns to avoid picking up random numbers far away from keywords
        // patterns match a max of 100 chars between keyword and amount
        const rentPatterns = [
            /yearly\s+rent\s+of\s+[\s\S]{0,100}?\$\s*([\d,]+(?:\.\d{2})?)/i,
            /annual\s+rent\s+of\s+[\s\S]{0,100}?\$\s*([\d,]+(?:\.\d{2})?)/i,
            /Yielding\s+and\s+Paying\s+[\s\S]{0,100}?\$\s*([\d,]+(?:\.\d{2})?)/i,
            /\$\s*([\d,]+(?:\.\d{2})?)\s*per\s*annum/i
        ];

        let regexRent = null;
        for (const pattern of rentPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const rentStr = match[1].replace(/,/g, '');
                const rentVal = parseFloat(rentStr);
                // Filter out likely bad matches (e.g. 0.00, year numbers, or one-time fee anomalies)
                if (rentVal > 0 && rentVal < 1000000 && rentVal !== 2021 && rentVal !== 2022 && rentVal !== 2023 && rentVal !== 2024 && rentVal !== 2025) {
                    regexRent = rentVal;
                    break;
                }
            }
        }

        // Logic: Only override AI if AI is null/0 OR if Regex found something different and looks plausible
        // But trust AI more if it found a logical value, as regex might catch a fee.
        if (regexRent) {
            console.log(`Regex found potential rent: ${regexRent}`);
            if (!flatResult.annualRentAmount || flatResult.annualRentAmount === 0) {
                console.log(`AI failed(val: ${flatResult.annualRentAmount}), using Regex fallback: ${regexRent}`);
                flatResult.annualRentAmount = regexRent;
            }
            // If AI found a value but it looks like a year (e.g., 2024), override it
            else if (flatResult.annualRentAmount > 2020 && flatResult.annualRentAmount < 2030) {
                console.log(`AI found year - like value(${flatResult.annualRentAmount}), overriding with Regex: ${regexRent}`);
                flatResult.annualRentAmount = regexRent;
            }
        }

        return flatResult;

    } catch (error) {
        console.error('Error analyzing contract with OpenAI:', error);
        throw new Error('Failed to analyze contract');
    }
};

/**
 * Chat with AI about contracts
 * @param {string} message - User message
 * @param {string} context - Context (e.g. contract text or summary)
 * @returns {Promise<string>} - AI response
 */
const chatWithAI = async (message, context = '') => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are the "AI Contract Assistant" for the Fiji Carbon Hub.
                    
                    Your Goal: Help users understand land lease contracts, carbon project eligibility, and legal details.

            Personality: Professional, knowledgeable, and helpful.Do NOT sound like a robot.Use natural language.

                Instructions:
        1. Use the provided[Context] to answer questions about the specific contract the user is looking at.
                    2. If the context contains contract details(Rent, Term, Score), refer to them explicitly in your answer.
                    3. If the user asks about "why" a score is low / high, explain based on the term length rules(Term < 10yr = Breach / Low Score, etc.).
                    4. Keep answers concise(2 - 3 sentences max usually).
                    
                    [Context]
                    ${context} `
                },
                {
                    role: "user",
                    content: message
                }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error chatting with AI:', error);
        return "I'm having trouble connecting to the AI service right now. Please try again later.";
    }
};

module.exports = {
    extractTextFromPDF,
    analyzeContract,
    chatWithAI
};
