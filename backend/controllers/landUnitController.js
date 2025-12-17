const LandUnit = require('../models/LandUnit');

// Create LandUnit
exports.createLandUnit = async (req, res) => {
    try {
        const landUnit = await LandUnit.create(req.body);
        res.status(201).json({
            success: true,
            data: landUnit
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get all LandUnits
exports.getLandUnits = async (req, res) => {
    try {
        const landUnits = await LandUnit.find();
        res.status(200).json({
            success: true,
            count: landUnits.length,
            data: landUnits
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get single LandUnit
exports.getLandUnit = async (req, res) => {
    try {
        const landUnit = await LandUnit.findById(req.params.id);
        if (!landUnit) {
            return res.status(404).json({
                success: false,
                error: 'LandUnit not found'
            });
        }
        res.status(200).json({
            success: true,
            data: landUnit
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Update LandUnit
exports.updateLandUnit = async (req, res) => {
    try {
        const landUnit = await LandUnit.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!landUnit) {
            return res.status(404).json({
                success: false,
                error: 'LandUnit not found'
            });
        }
        res.status(200).json({
            success: true,
            data: landUnit
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Delete LandUnit
exports.deleteLandUnit = async (req, res) => {
    try {
        const landUnit = await LandUnit.findByIdAndDelete(req.params.id);
        if (!landUnit) {
            return res.status(404).json({
                success: false,
                error: 'LandUnit not found'
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
