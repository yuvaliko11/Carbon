const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CarbonContractSchema = new mongoose.Schema({
    leaseNumber: String,
    name: String,
    fileUrl: String,
    status: String,
    greenScore: Number,
    createdAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    extractedData: Object // Added this based on the new logging
});
const CarbonContract = mongoose.model('CarbonContract', CarbonContractSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // const contracts = await CarbonContract.find({ createdAt: { $gte: oneDayAgo } });

        // console.log('Contracts created in last 24h:', contracts.length);

        // contracts.forEach(c => {
        //     const filePath = path.join(__dirname, 'uploads', path.basename(c.fileUrl));
        //     const exists = fs.existsSync(filePath);
        //     console.log(`Contract: ${c.name} | ID: ${c._id} | File: ${c.fileUrl} | Exists: ${exists}`);
        //     console.log(`   Full Path Checked: ${filePath}`);
        // });

        const recentContracts = await CarbonContract.find({})
            .sort({ createdAt: -1 })
            .limit(5);

        console.log(`Found ${recentContracts.length} recent contracts.`);

        for (const contract of recentContracts) {
            console.log('\n--- Contract ---');
            console.log('ID:', contract._id);
            console.log('Lease Number:', contract.leaseNumber); // Should be "4160"
            console.log('Name:', contract.name); // Should be "Lease No 4160.pdf" (?)
            console.log('File URL (DB):', contract.fileUrl);
            console.log('Extracted Data Keys:', contract.extractedData ? Object.keys(contract.extractedData) : 'None');

            // Check file on disk
            if (contract.fileUrl) {
                // fileUrl might be absolute URL or relative path
                // If it's a URL like http://.../uploads/file.pdf, extract path
                let filePath = contract.fileUrl;
                if (filePath.startsWith('http')) {
                    const urlParts = filePath.split('/uploads/');
                    if (urlParts.length > 1) {
                        filePath = path.join(__dirname, 'uploads', urlParts[1]);
                    }
                } else if (filePath.startsWith('/uploads/')) {
                    filePath = path.join(__dirname, filePath);
                }

                // If simple filename
                if (!filePath.includes('/')) {
                    filePath = path.join(__dirname, 'uploads', filePath);
                }

                if (fs.existsSync(filePath)) {
                    console.log('✅ File EXISTS on disk:', filePath);
                } else {
                    console.log('❌ File MISSING on disk:', filePath);
                }
            } else {
                console.log('⚠️ No fileUrl in DB');
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();

