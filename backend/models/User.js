const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['landowner', 'developer', 'buyer', 'government', 'auditor', 'admin', 'worker'],
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    profileImage: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
