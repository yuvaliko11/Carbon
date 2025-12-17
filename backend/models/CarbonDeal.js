const mongoose = require('mongoose');

const carbonDealSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Spot', 'Forward', 'Offtake'],
        default: 'Spot'
    },
    buyerOrganization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    buyerName: String, // If not an org in system
    sellerOrganization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    leases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lease'
    }],
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CarbonProject'
    },
    creditBatches: [{
        batch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CarbonCreditBatch'
        },
        quantity: Number
    }],
    volumeTCO2e: {
        type: Number,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    totalValue: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Negotiation', 'Signed', 'Active', 'Completed', 'Cancelled'],
        default: 'Draft'
    },
    contractDocument: {
        type: String, // URL or file ID
        trim: true
    },
    schedule: [{
        milestoneName: String,
        dueDate: Date,
        condition: {
            type: String,
            enum: ['Signature', 'Verification', 'Issuance', 'Delivery']
        },
        amount: Number,
        currency: String,
        status: {
            type: String,
            enum: ['Pending', 'Due', 'Paid', 'Skipped'],
            default: 'Pending'
        }
    }],
    documents: [{
        type: {
            type: String,
            enum: ['ERPA', 'Invoice', 'Receipt', 'RetirementCertificate', 'Other']
        },
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
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
carbonDealSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CarbonDeal', carbonDealSchema);
