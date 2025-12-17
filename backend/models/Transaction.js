const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Incoming', 'Outgoing'],
        required: true
    },
    source: {
        type: String,
        enum: ['Deal', 'TransferFee', 'AnnualRent', 'Other'],
        required: true
    },
    lease: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lease'
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CarbonProject'
    },
    deal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CarbonDeal'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'FJD'
    },
    payerOrganization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    receiverOrganization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    executedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    reference: {
        type: String, // External payment ref
        trim: true
    },
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
transactionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
