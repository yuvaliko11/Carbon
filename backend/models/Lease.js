const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
    leaseNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true // e.g., "4159"
    },
    tltbFileRef: {
        type: String,
        trim: true // e.g., "4/1242466"
    },
    fileUrl: {
        type: String, // URL/Path to the uploaded contract file
        trim: true
    },
    type: {
        type: String,
        enum: ['Conservation', 'Agriculture', 'Tourism', 'Residential', 'Commercial', 'Industrial', 'Religious', 'Educational', 'Other'],
        required: true
    },
    purpose: {
        type: String,
        required: true // e.g., "Special Conservation Purpose"
    },
    lessorLandUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LandUnit',
        required: true
    },
    lesseeOrganization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    parcels: [{
        parcel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Parcel'
        },
        areaHaAtGrant: Number,
        isDemarcatedForCarbon: {
            type: Boolean,
            default: false
        }
    }],
    termYears: {
        type: Number,
        required: true,
        default: 50
    },
    startDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    annualRent: {
        currency: {
            type: String,
            default: 'FJD'
        },
        amount: {
            type: Number,
            required: true // e.g., 2000
        },
        payableInAdvance: {
            type: Boolean,
            default: true
        }
    },
    registrationFee: {
        amount: Number,
        currency: {
            type: String,
            default: 'FJD'
        }
    },
    transferFeeRules: {
        withImprovements: {
            firstNYears: { type: Number, default: 10 },
            percentFirstPeriod: { type: Number, default: 20 },
            percentAfter: { type: Number, default: 10 }
        },
        withoutImprovements: {
            firstNYears: { type: Number, default: 10 },
            percentFirstPeriod: { type: Number, default: 25 },
            percentAfter: { type: Number, default: 10 }
        }
    },
    carbonParticipation: {
        enabled: {
            type: Boolean,
            default: true
        },
        mandatorySharePercentToOtherLandUnit: {
            type: Number,
            default: 0 // e.g., 5 for Clause 4(b)
        },
        beneficiaryLandUnit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LandUnit'
        }
    },
    status: {
        type: String,
        enum: ['Draft', 'Active', 'Suspended', 'Expired', 'Terminated', 'Transferred'],
        default: 'Draft'
    },
    complianceStatus: {
        type: String,
        enum: ['compliant', 'warning', 'breach', 'unknown'],
        default: 'unknown'
    },
    greenScore: {
        type: Number,
        default: 0
    },
    improvementsFlag: {
        type: String,
        enum: ['WithImprovements', 'NoImprovements', 'Unknown'],
        default: 'Unknown'
    },
    specialConditions: [String],
    documents: [{
        type: {
            type: String,
            enum: ['SignedLease', 'Diagram', 'FPIC', 'BoardResolution', 'Other']
        },
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
}, { timestamps: true });

// Pre-save hook to calculate expiry date if not set
leaseSchema.pre('validate', async function () {
    if (this.startDate && this.termYears && !this.expiryDate) {
        const expiry = new Date(this.startDate);
        expiry.setFullYear(expiry.getFullYear() + this.termYears);
        this.expiryDate = expiry;
    }
});

module.exports = mongoose.model('Lease', leaseSchema);
