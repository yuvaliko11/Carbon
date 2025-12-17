const mongoose = require('mongoose');

const carbonCreditBatchSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CarbonProject',
        required: true
    },
    leases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lease'
    }],
    vintageYear: {
        type: Number,
        required: true // e.g., 2023
    },
    quantity: {
        type: Number,
        required: true // Total tCO2e in batch
    },
    registry: {
        type: String,
        enum: ['Internal', 'Verra', 'GoldStandard', 'Other'],
        default: 'Internal'
    },
    externalSerialRange: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Issued', 'Listed', 'Reserved', 'Transferred', 'Retired'],
        default: 'Issued'
    },
    areaBreakdown: [{
        parcel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Parcel'
        },
        areaHa: Number,
        proportionOfBatch: Number // To support demarcated area-based sharing
    }],
    issuanceDate: Date,
    retirementDate: Date,
    retirementBeneficiary: String, // Name of entity retiring credits
    retirementReason: String,
    metadata: {
        type: Map,
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
carbonCreditBatchSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CarbonCreditBatch', carbonCreditBatchSchema);
