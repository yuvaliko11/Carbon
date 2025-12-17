const Parcel = require('../models/Parcel');

// Create Parcel
exports.createParcel = async (req, res) => {
    try {
        const parcel = await Parcel.create(req.body);
        res.status(201).json({
            success: true,
            data: parcel
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get all Parcels
exports.getParcels = async (req, res) => {
    try {
        const parcels = await Parcel.find().populate('landUnit');
        res.status(200).json({
            success: true,
            count: parcels.length,
            data: parcels
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get single Parcel
exports.getParcel = async (req, res) => {
    try {
        const parcel = await Parcel.findById(req.params.id).populate('landUnit');
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found'
            });
        }
        res.status(200).json({
            success: true,
            data: parcel
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Update Parcel
exports.updateParcel = async (req, res) => {
    try {
        const parcel = await Parcel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found'
            });
        }
        res.status(200).json({
            success: true,
            data: parcel
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Delete Parcel
exports.deleteParcel = async (req, res) => {
    try {
        const parcel = await Parcel.findByIdAndDelete(req.params.id);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: 'Parcel not found'
            });
        }
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};
