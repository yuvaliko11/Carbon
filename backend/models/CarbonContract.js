const mongoose = require('mongoose');

const carbonContractSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    originalFileName: String,
    fileUrl: String, // URL if stored in cloud, or path
    fileSize: Number,
    mimeType: String,

    // Extracted Metadata
    leaseNumber: String,
    mataqaliName: String,
    termYears: Number,
    annualRent: {
        amount: Number,
        currency: {
            type: String,
            default: 'FJD'
        }
    },
    startDate: Date,

    // Flexible storage for detailed AI extraction (50+ fields)
    extractedData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Analysis
    status: {
        type: String,
        enum: ['compliant', 'warning', 'breach', 'pending'],
        default: 'pending'
    },
    greenScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    // Geo
    location: {
        type: {
            type: String,
            enum: ['Point', 'Polygon'],
            default: 'Polygon'
        },
        coordinates: {
            type: [], // Allow array of numbers (Point) or array of arrays (Polygon)
            default: [[[178.4419, -18.1416], [178.4429, -18.1416], [178.4429, -18.1406], [178.4419, -18.1406], [178.4419, -18.1416]]] // Default Polygon in Suva
        }
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CarbonContract', carbonContractSchema);
