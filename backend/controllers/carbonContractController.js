const CarbonContract = require('../models/CarbonContract');
const Lease = require('../models/Lease');
const Parcel = require('../models/Parcel');
const LandUnit = require('../models/LandUnit');
const Organization = require('../models/Organization');
const fs = require('fs');
const path = require('path');
const { parseFijiCoordinatesToGeoJSON } = require('../utils/geoUtils');

const pdf = require('pdf-parse'); // Added import

// Create/Upload Contract
exports.uploadContract = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // DEBUG: Debug file reception
        console.log('📂 Upload Request Received. Files:', req.files.map(f => ({
            orig: f.originalname,
            size: f.size,
            mimetype: f.mimetype
        })));

        // Group files by basename (ignoring extension) to associate Coordinates (CSV/TXT) with Contracts (PDF)
        const fileGroups = {};
        for (const file of req.files) {
            const ext = path.extname(file.originalname).toLowerCase();

            // Check for explicit .coords.pdf suffix (User Interaction Flow)
            const isCoordsPdf = file.originalname.toLowerCase().endsWith('.coords.pdf');

            // robustly get basename without extension (handles case mismatch in extension)
            let basename = path.parse(file.originalname).name;

            if (isCoordsPdf) {
                // If basename is 'Contract.coords', strip '.coords' to get 'Contract'
                basename = basename.replace(/\.coords$/i, '');
            }

            // NORMALIZE BASENAME: Remove spaces, underscores, and convert to lowercase for robust matching
            // This ensures "Lease No 4160.csv" pairs with "Lease_No_4160.pdf"
            const normalizedBasename = basename.replace(/[\s_]+/g, '').toLowerCase();

            if (!fileGroups[normalizedBasename]) {
                fileGroups[normalizedBasename] = { pdf: null, coords: null, originalBasename: basename };
            }

            if (isCoordsPdf) {
                fileGroups[normalizedBasename].coords = file;
            } else if (ext === '.pdf') {
                fileGroups[normalizedBasename].pdf = file;
            } else if (ext === '.csv' || ext === '.txt') {
                fileGroups[normalizedBasename].coords = file;
            }
        }

        const uploadedContracts = [];

        // Ensure default lessee exists
        let defaultLessee = await Organization.findOne({ name: 'Fiji Carbon Hub' });
        if (!defaultLessee) {
            defaultLessee = await Organization.create({
                name: 'Fiji Carbon Hub',
                type: 'developer',
                description: 'Default lessee for uploaded contracts',
                verificationStatus: 'verified'
            });
        }

        const aiService = require('../services/aiService');

        // Iterate over file GROUPS
        for (const basename of Object.keys(fileGroups)) {
            const group = fileGroups[basename];
            const file = group.pdf;

            // Use the PDF as the main file. If we only have a CSV, we skip it.
            if (!file) {
                if (group.coords) {
                    console.warn(`Skipping coordinate file ${group.coords.originalname} because no matching PDF was found.`);
                }
                continue;
            }

            let analysisResult = {};

            // Try AI Analysis first
            console.log('DEBUG: Checking API Key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
            console.log('DEBUG: File path:', file.path);

            if (process.env.OPENAI_API_KEY) {
                try {
                    console.log(`🤖 Analyzing ${file.originalname} with AI...`);
                    const text = await aiService.extractTextFromPDF(file.path);
                    analysisResult = await aiService.analyzeContract(text);
                    console.log('✅ AI Analysis Complete:', analysisResult);
                } catch (error) {
                    console.error('⚠️ AI Analysis failed, falling back to deterministic logic:', error.message);
                }
            }

            // Deterministic Fallback REMOVED: User wants AI to take every detail every time.
            const finalScore = analysisResult.greenScore || 0;
            // Force status to match score to avoid AI hallucinations
            const finalStatus = finalScore >= 80 ? 'compliant' : (finalScore >= 50 ? 'warning' : 'breach');

            // Try to extract lease number from filename as a backup for AI
            const leaseNumberMatch = file.originalname.match(/lease[._\-\s]*(?:no\.?|number)?[._\-\s]*(\d+)/i);
            const extractedLeaseNumber = leaseNumberMatch ? leaseNumberMatch[1] : null;

            // Helper to sanitize AI result
            const sanitize = (val) => (val === 'N/A' || val === 'null' || val === 'Unknown' || val === '') ? null : val;

            const leaseNumber = sanitize(analysisResult.leaseNumber) || extractedLeaseNumber || `Unknown-${Date.now()}`;
            const mataqaliName = sanitize(analysisResult.mataqaliName) || 'Unknown Landowner';

            // Try to extract term from filename or text if AI missed it
            let extractedTerm = null;
            const termMatch = file.originalname.match(/(\d+)\s*(?:year|yr)/i);
            if (termMatch) {
                extractedTerm = parseInt(termMatch[1]);
            }

            const termYears = analysisResult.termYears || extractedTerm || 0;
            const annualRentAmount = analysisResult.annualRentAmount || 0;

            // Geo Logic
            let location = analysisResult.location;

            // Check for valid location structure
            const isValidLocation = (loc) => {
                if (!loc || !loc.coordinates) return false;
                // Check if it's a Polygon with actual content (not just [[]])
                if (loc.type === 'Polygon') {
                    return loc.coordinates.length > 0 && loc.coordinates[0].length > 0;
                }
                if (loc.type === 'Point') {
                    return loc.coordinates.length === 2;
                }
                return false;
            };

            // X/Y Polygon Construction Override
            if (group.coords) {
                try {
                    console.log(`🗺️ Found coordinate file: ${group.coords.originalname}, attempting to parse...`);
                    const coordsContent = fs.readFileSync(group.coords.path, 'utf8');
                    const parsedLocation = parseFijiCoordinatesToGeoJSON(coordsContent);
                    if (isValidLocation(parsedLocation)) {
                        console.log(`✅ Successfully constructed polygon from ${group.coords.originalname}`);
                        location = parsedLocation;
                    } else {
                        console.warn(`⚠️ Parsed coordinates from ${group.coords.originalname} resulted in empty/invalid geometry.`);
                    }
                } catch (geoErr) {
                    console.error(`❌ Failed to parse coordinates from ${group.coords.originalname}:`, geoErr.message);
                }
            }

            if (!isValidLocation(location)) {
                // Default to a null location or a generic Fiji center point to avoid crashing map, 
                // BUT do not generate random shapes.
                // Let's use a single point for "Unknown" to be safe.
                location = {
                    type: 'Polygon',
                    coordinates: [[
                        [178.4419, -18.1416],
                        [178.4519, -18.1416],
                        [178.4519, -18.1316],
                        [178.4419, -18.1316],
                        [178.4419, -18.1416]
                    ]]
                };
            }

            // Parse Start Date from AI or default to now (Fallback)
            // Expecting YYYY-MM-DD from AI
            let aiStartDate = null;
            if (analysisResult.extractedData?.term?.startDate) {
                aiStartDate = new Date(analysisResult.extractedData.term.startDate);
            } else if (analysisResult.term?.startDate) { // Access flat result if mapped
                aiStartDate = new Date(analysisResult.term.startDate);
            }

            // Validate Date
            if (aiStartDate && isNaN(aiStartDate.getTime())) {
                console.warn(`⚠️  Invalid Date from AI: ${analysisResult.extractedData?.term?.startDate}, defaulting to NOW.`);
                aiStartDate = null;
            }

            const contractStartDate = aiStartDate || new Date();


            // 1. Create/Find Land Unit
            let landUnit = await LandUnit.findOne({ name: mataqaliName });
            if (!landUnit) {
                landUnit = await LandUnit.create({
                    name: mataqaliName,
                    type: 'mataqali',
                    province: 'Ba', // Mock
                    tikina: 'Vuda'  // Mock
                });
                console.log('Created LandUnit:', landUnit.name);
            }

            // 2. Create Parcel
            let parcel;
            try {
                parcel = await Parcel.create({
                    name: `Parcel for ${leaseNumber}`,
                    landUnit: landUnit._id,
                    geometry: location,
                    areaHa: 100, // Mock area
                    province: 'Ba', // Mock
                    tikina: 'Vuda'  // Mock
                });
                console.log('Created Parcel:', parcel.name);
            } catch (err) {
                console.error('Parcel creation failed (likely geometry):', err.message);
                // Fallback to simple geometry if AI geometry is invalid (e.g. self-intersecting)
                const fallbackLocation = {
                    type: 'Polygon',
                    coordinates: [[
                        [178.4419, -18.1416],
                        [178.4519, -18.1416],
                        [178.4519, -18.1316],
                        [178.4419, -18.1316],
                        [178.4419, -18.1416]
                    ]]
                };
                parcel = await Parcel.create({
                    name: `Parcel for ${leaseNumber} (Fallback)`,
                    landUnit: landUnit._id,
                    geometry: fallbackLocation,
                    areaHa: 100,
                    province: 'Ba',
                    tikina: 'Vuda'
                });
                console.log('Created Parcel with fallback geometry:', parcel.name);
            }

            // 3. Create Lease
            let lease;
            try {
                lease = await Lease.create({
                    leaseNumber: leaseNumber,
                    lessorLandUnit: landUnit._id,
                    lesseeOrganization: defaultLessee._id,
                    parcels: [{
                        parcel: parcel._id,
                        areaHaAtGrant: 100,
                        isDemarcatedForCarbon: true
                    }],
                    termYears: termYears,
                    startDate: contractStartDate,
                    type: 'Agriculture',
                    purpose: 'General Agriculture',
                    expiryDate: new Date(new Date(contractStartDate).setFullYear(contractStartDate.getFullYear() + termYears)),
                    annualRent: { amount: annualRentAmount },
                    status: 'Active',
                    complianceStatus: finalStatus,
                    fileUrl: `/uploads/${file.filename}`,
                    originalFileName: file.originalname,
                    uploadedBy: req.user._id,
                    greenScore: finalScore
                });
                console.log('Created Lease:', lease.leaseNumber);
            } catch (err) {
                if (err.code === 11000) {
                    console.warn(`Duplicate lease number ${leaseNumber}, skipping creation.`);
                    console.error(`Skipping due to duplicate: ${leaseNumber}`);
                    continue;
                }
                throw err;
            }

            // 4. Create Carbon Contract (File Record)
            const newContract = await CarbonContract.create({
                leaseNumber: leaseNumber,
                name: file.originalname.replace(/\.pdf$/i, ''), // Clean name
                fileUrl: `/uploads/${file.filename}`,
                status: finalStatus,
                greenScore: finalScore,
                location: location,
                uploadedBy: req.user.id,
                // Save extracted metadata to ensure consistency with Registry
                termYears: termYears,
                startDate: contractStartDate, // Persist identified Start Date
                annualRent: {
                    amount: annualRentAmount,
                    currency: 'FJD'
                },
                mataqaliName: mataqaliName,
                extractedData: analysisResult.extractedData || {}
            });

            console.log(`✅ ExtractedData Keys for ${leaseNumber}:`, Object.keys(newContract.extractedData || {}));
            console.log('Contract Created:', newContract);

            console.log('Contract Created:', newContract);
            uploadedContracts.push(newContract);
        }

        console.log('All Uploaded:', uploadedContracts); // DEBUG LOG

        res.status(201).json({
            success: true,
            count: uploadedContracts.length,
            data: uploadedContracts
        });

    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create Single (Manual Entry)
exports.create = async (req, res) => {
    try {
        const { leaseNumber, name, fileUrl, status, greenScore, location } = req.body;
        const aiService = require('../services/aiService');
        const path = require('path');

        let finalScore = greenScore;
        let finalStatus = status;
        let analysisResult = {};

        // If fileUrl is provided and we want AI analysis (no score provided or explicit flag)
        // For manual entry, we want AI to override the default if possible, or calculate it if missing.
        if (fileUrl && process.env.OPENAI_API_KEY) {
            try {
                // Resolve file path
                // fileUrl is like '/uploads/filename.pdf'
                const filePath = path.join(__dirname, '..', fileUrl);

                if (fs.existsSync(filePath)) {
                    console.log(`🤖 Analyzing manual contract ${name} with AI...`);
                    const text = await aiService.extractTextFromPDF(filePath);
                    analysisResult = await aiService.analyzeContract(text);
                    console.log('✅ AI Analysis Complete:', analysisResult);

                    if (analysisResult.greenScore) {
                        finalScore = analysisResult.greenScore;
                        // Force status to match score
                        finalStatus = finalScore > 80 ? 'compliant' : (finalScore > 60 ? 'warning' : 'breach');
                    }
                } else {
                    console.warn(`⚠️ File not found for analysis: ${filePath}`);
                }
            } catch (error) {
                console.error('⚠️ AI Analysis failed for manual entry:', error.message);
            }
        } else if (process.env.OPENAI_API_KEY) {
            // No PDF, but we have manual fields. Construct a text summary for AI.
            console.log(`🤖 Analyzing manual entry (no PDF) for ${name}...`);
            try {
                // Fetch lessee name if possible, or just use ID
                let lesseeName = req.body.lesseeOrganization;
                if (req.body.lesseeOrganization && req.body.lesseeOrganization.match(/^[0-9a-fA-F]{24}$/)) {
                    const org = await Organization.findById(req.body.lesseeOrganization);
                    if (org) lesseeName = org.name;
                }

                const manualText = `
                    Lease Contract Summary for Carbon Eligibility Analysis:
                    
                    Lease Number: ${leaseNumber}
                    Lease Name: ${name}
                    Type: ${req.body.type || 'Unknown'}
                    Purpose: ${req.body.purpose || 'Unknown'}
                    Term: ${req.body.termYears || 'Unknown'} years
                    Start Date: ${req.body.startDate || 'Unknown'}
                    Annual Rent: $${req.body.annualRentAmount || 'Unknown'}
                    Lessee: ${lesseeName || 'Unknown'}
                    
                    Description: This is a manually entered lease record. Please analyze the provided details (Type, Purpose, Term, Lessee) to determine the Green Score and Compliance Status for a carbon project.
                    - **CRITICAL**: If Term < 10 years, Score MUST be < 40 (Breach).
                    - **CRITICAL**: If Term < 30 years, Score MUST be < 60 (Breach/Warning).
                    - Conservation/Protection purposes with long terms (>50y) should score HIGH (>80).
                    - Agriculture/Commercial with medium terms (30-50y) should score MEDIUM (60-80).
                    - Extractive/Industrial or short terms (<30y) should score LOW (<60).
                `;

                analysisResult = await aiService.analyzeContract(manualText);
                console.log('✅ AI Analysis (Text-based) Complete:', analysisResult);

                if (analysisResult.greenScore) {
                    finalScore = analysisResult.greenScore;
                    finalStatus = analysisResult.status || (finalScore > 80 ? 'compliant' : (finalScore > 60 ? 'warning' : 'breach'));
                }
            } catch (error) {
                console.error('⚠️ AI Analysis failed for text-based manual entry:', error.message);
            }
        }

        // Fallback if no score yet
        if (finalScore === undefined || finalScore === null) {
            // Deterministic fallback based on rules
            const term = parseInt(req.body.termYears) || 0;
            if (term < 10) {
                finalScore = 30;
                finalStatus = 'breach';
            } else if (term < 30) {
                finalScore = 55;
                finalStatus = 'warning';
            } else {
                finalScore = 85;
                finalStatus = 'compliant';
            }
        }

        const newContract = await CarbonContract.create({
            leaseNumber,
            name,
            fileUrl,
            status: finalStatus,
            greenScore: finalScore,
            location,
            uploadedBy: req.user.id,
            // Add other AI extracted fields if available
            mataqaliName: analysisResult.mataqaliName,
            termYears: analysisResult.termYears,
            annualRent: analysisResult.annualRentAmount ? { amount: analysisResult.annualRentAmount, currency: 'FJD' } : undefined,
            extractedData: analysisResult.extractedData || {}
        });

        // Handle Manual Coordinate Data Override
        if (req.body.coordinateData) {
            try {
                console.log('🗺️ Processing manual coordinate data...');
                const { parseFijiCoordinatesToGeoJSON } = require('../utils/geoUtils');
                const parsedLocation = parseFijiCoordinatesToGeoJSON(req.body.coordinateData);

                if (parsedLocation && parsedLocation.coordinates && parsedLocation.coordinates.length > 0) {
                    console.log('✅ Successfully constructed polygon from manual coordinate data');
                    newContract.location = parsedLocation;
                    // Re-save with new location
                    await newContract.save();
                } else {
                    console.warn('⚠️ Manual coordinate data resulted in empty/invalid geometry.');
                }
            } catch (geoErr) {
                console.error('❌ Failed to parse manual coordinate data:', geoErr.message);
            }
        }

        res.status(201).json({ success: true, data: newContract });
    } catch (err) {
        console.error('Create Error:', err);
        res.status(400).json({ success: false, error: err.message });
    }
};

// Get All
exports.getAll = async (req, res) => {
    try {
        const contracts = await CarbonContract.find().sort('-createdAt');
        console.log('Fetching Contracts:', contracts.length);
        if (contracts.length > 0) {
            console.log('Sample Contract Location (First):', JSON.stringify(contracts[0].location));
        }
        res.status(200).json({ success: true, data: contracts });
    } catch (err) {
        console.error('Get All Error:', err);
        res.status(400).json({ success: false, error: err.message });
    }
};

// Chat with AI
exports.chat = async (req, res) => {
    try {
        const { message, context } = req.body;
        const response = await aiService.chatWithAI(message, context);
        res.status(200).json({ success: true, reply: response });
    } catch (err) {
        console.error('Chat Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Single
exports.getById = async (req, res) => {
    try {
        const contract = await CarbonContract.findById(req.params.id);
        if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });
        res.status(200).json({ success: true, data: contract });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// Delete
// Delete
exports.delete = async (req, res) => {
    try {
        const contract = await CarbonContract.findById(req.params.id);
        if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' });

        // Cascade Delete: Delete associated Lease and Parcels if they exist
        if (contract.leaseNumber) {
            // Use case-insensitive search and trim whitespace
            const leaseNumberClean = contract.leaseNumber.trim();
            const lease = await Lease.findOne({
                leaseNumber: { $regex: new RegExp(`^${leaseNumberClean}$`, 'i') }
            });

            if (lease) {
                // Delete associated Parcels
                if (lease.parcels && lease.parcels.length > 0) {
                    const parcelIds = lease.parcels
                        .filter(p => p.parcel) // Ensure parcel ID exists
                        .map(p => p.parcel);

                    if (parcelIds.length > 0) {
                        // Delete parcels that are in the lease's list OR reference this lease
                        const deleteResult = await Parcel.deleteMany({
                            $or: [
                                { _id: { $in: parcelIds } },
                                { currentLeases: lease._id }
                            ]
                        });
                        console.log(`Cascade deleted ${deleteResult.deletedCount} parcels for lease ${lease.leaseNumber}`);
                    } else {
                        // Even if no parcels in list, check for any referencing this lease
                        const deleteResult = await Parcel.deleteMany({ currentLeases: lease._id });
                        console.log(`Cascade deleted ${deleteResult.deletedCount} referencing parcels for lease ${lease.leaseNumber}`);
                    }
                }

                await lease.deleteOne();
                console.log(`Cascade deleted lease ${lease.leaseNumber} for contract ${contract._id}`);
            } else {
                console.warn(`⚠️ Cascade Delete: Lease not found for contract ${contract.leaseNumber}`);
            }
        }

        await contract.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
