const mongoose = require('mongoose');

const landUnitSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['yavusa', 'mataqali', 'other'],
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    tltbRef: {
        type: String,
        trim: true
    },
    province: {
        type: String,
        trim: true
    },
    tikina: {
        type: String,
        trim: true
    },
    contacts: [{
        name: String,
        role: String, // e.g., Turaga-ni-koro, Trustee
        email: String,
        phone: String
    }],
    bankDetails: {
        beneficiaryName: String,
        bankName: String,
        accountNumber: String,
        currency: {
            type: String,
            default: 'FJD'
        }
    },
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

module.exports = mongoose.model('LandUnit', landUnitSchema);
