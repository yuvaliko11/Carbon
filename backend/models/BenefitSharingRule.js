const mongoose = require('mongoose');

const benefitSharingRuleSchema = new mongoose.Schema({
    scope: {
        type: String,
        enum: ['Lease', 'Project', 'Sale', 'Transfer'],
        required: true
    },
    lease: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lease'
    },
    project: { // Will reference Project model later
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    appliesTo: {
        type: String,
        enum: ['CarbonSale', 'TransferPrice', 'AnnualRent', 'Other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    isMandatory: {
        type: Boolean,
        default: false
    },
    percentageSplits: [{
        beneficiaryType: {
            type: String,
            enum: ['LandUnit', 'Organization', 'GovFund'],
            required: true
        },
        beneficiaryId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'percentageSplits.beneficiaryType' // Dynamic reference
        },
        percent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        conditions: {
            type: Map,
            of: String // e.g., "only for demarcated parcels"
        }
    }],
    calculationBasis: {
        type: String,
        enum: ['GrossSale', 'NetAfterFees', 'TransferSalePrice', 'AnnualRent'],
        default: 'GrossSale'
    },
    priority: {
        type: Number,
        default: 1 // Higher number = higher priority
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
benefitSharingRuleSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('BenefitSharingRule', benefitSharingRuleSchema);
