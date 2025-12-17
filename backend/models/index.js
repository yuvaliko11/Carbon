const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 1. Land Parcel (GeoJSON)
const LandParcelSchema = new Schema({
    parcel_id: { type: String, required: true, index: true },
    name: String,
    tikina: String,
    province: String,
    country: { type: String, default: 'Fiji' },
    area_ha: Number,
    location: {
        type: { type: String, enum: ['Polygon', 'MultiPolygon'], default: 'Polygon' },
        coordinates: [[[Number]]] // [Long, Lat]
    },
    boundary_files: [{ file_type: String, url: String }]
});

// 2. Lease Agreement
const LeaseAgreementSchema = new Schema({
    lease_id: { type: String, unique: true },
    file_reference: String,
    status: { type: String, enum: ['Draft', 'Active', 'Terminated'], default: 'Active' },
    lessor: { name: String, address: String, share_percentage: Number },
    lessee: { name: String, type: String, address: String },
    term_years: Number,
    effective_date: Date,
    expiry_date: Date,
    annual_rent: { amount: Number, currency: String },
    purpose: String,
    restrictions: [String],
    carbon_rights: { exists: Boolean, clause_text: String },
    parcels: [{ type: Schema.Types.ObjectId, ref: 'LandParcel' }],
    original_contract_url: String
});

// 3. Carbon Project
const CarbonProjectSchema = new Schema({
    project_name: String,
    project_type: { type: String, enum: ['REDD+', 'ARR', 'BlueCarbon'] },
    status: { type: String, enum: ['Concept', 'Registered', 'Issuing'] },
    related_lease: { type: Schema.Types.ObjectId, ref: 'LeaseAgreement' },
    assets: { lidar_data_url: String, drone_video_url: String }
});

module.exports = {
    LandParcel: mongoose.model('LandParcel', LandParcelSchema),
    LeaseAgreement: mongoose.model('LeaseAgreement', LeaseAgreementSchema),
    CarbonProject: mongoose.model('CarbonProject', CarbonProjectSchema)
};
