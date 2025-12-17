const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['government', 'developer', 'buyer', 'ngo', 'mrv_provider', 'landowner_group', 'lessee'],
        required: true
    },
    registrationNumber: {
        type: String, // Business registration or Tax ID
        trim: true
    },
    address: {
        street: String,
        city: String,
        country: {
            type: String,
            default: 'Fiji'
        }
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
    },
    verificationDocuments: [{
        name: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    website: String,
    description: String,
    logo: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Organization', organizationSchema);
