const mongoose = require('mongoose');

const contractTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        enum: ['Lease', 'License', 'MOU', 'Other'],
        default: 'Lease'
    },
    content: {
        type: String, // HTML or Markdown content with placeholders
        required: true
    },
    placeholders: [String], // e.g., ['{{lesseeName}}', '{{termYears}}']
    isActive: {
        type: Boolean,
        default: true
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
contractTemplateSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ContractTemplate', contractTemplateSchema);
