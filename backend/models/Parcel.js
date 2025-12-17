const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // e.g., "LumiLumitabua (Part Of)"
        trim: true
    },
    tltbRef: {
        type: String,
        trim: true // e.g., "4/1242466"
    },
    tikina: {
        type: String,
        required: true
    },
    province: {
        type: String,
        required: true
    },
    areaHa: {
        type: Number,
        required: true // e.g., 594.6789
    },
    geometry: {
        type: {
            type: String,
            enum: ['Polygon', 'MultiPolygon'],
            required: true
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of arrays of numbers
            required: true
        }
    },
    landUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LandUnit',
        required: true
    },
    ownershipType: {
        type: String,
        enum: ['iTaukei', 'State', 'Freehold'],
        default: 'iTaukei'
    },
    currentLeases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lease'
    }],
    metadata: {
        type: Map,
        of: String
    }
}, { timestamps: true });

// Index for geospatial queries
parcelSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Parcel', parcelSchema);
