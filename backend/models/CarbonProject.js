const mongoose = require('mongoose');

const carbonProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    standard: {
        type: String,
        enum: ['Verra', 'GoldStandard', 'ART', 'PlanVivo', 'FijiNational', 'Other'],
        required: true
    },
    methodologyCode: {
        type: String,
        required: true // e.g., "VM0033"
    },
    type: {
        type: String,
        enum: ['REDD+', 'ARR', 'BlueCarbon', 'Other'],
        default: 'REDD+'
    },
    developerOrganization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    leases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lease'
    }],
    parcels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parcel'
    }],
    status: {
        type: String,
        enum: ['Design', 'Validation', 'Registered', 'Monitoring', 'Verified', 'Issuing', 'Closed'],
        default: 'Design'
    },
    creditingPeriodStart: Date,
    creditingPeriodEnd: Date,
    validatorOrganization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    registryProjectId: {
        type: String,
        trim: true
    },
    documents: [{
        type: {
            type: String,
            enum: ['PDD', 'ValidationReport', 'MonitoringReport', 'VerificationReport', 'Other']
        },
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
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
carbonProjectSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CarbonProject', carbonProjectSchema);
