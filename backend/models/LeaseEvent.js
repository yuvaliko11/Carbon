const mongoose = require('mongoose');

const leaseEventSchema = new mongoose.Schema({
    lease: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lease',
        required: true
    },
    type: {
        type: String,
        enum: [
            'LeaseActivated',
            'AnnualRentDue',
            'AnnualRentPaid',
            'CarbonSaleRecorded',
            'LeaseTransferProposed',
            'LeaseTransferred',
            'ImprovementStatusUpdated',
            'LeaseExpired',
            'Other'
        ],
        required: true
    },
    payload: {
        type: mongoose.Schema.Types.Mixed, // Flexible payload
        default: {}
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LeaseEvent', leaseEventSchema);
