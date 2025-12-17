const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    beneficiaryType: {
        type: String,
        enum: ['LandUnit', 'Organization', 'GovFund'],
        required: true
    },
    beneficiaryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'beneficiaryType'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'FJD'
    },
    status: {
        type: String,
        enum: ['Pending', 'Disbursed', 'Failed'],
        default: 'Pending'
    },
    disbursedAt: Date,
    bankReference: String,
    notes: String,
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
payoutSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Payout', payoutSchema);
