const ContractTemplate = require('../models/ContractTemplate');

// Create Template
exports.createTemplate = async (req, res) => {
    try {
        const template = await ContractTemplate.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.status(201).json({
            success: true,
            data: template
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get all Templates
exports.getTemplates = async (req, res) => {
    try {
        const templates = await ContractTemplate.find({ isActive: true });
        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get single Template
exports.getTemplate = async (req, res) => {
    try {
        const template = await ContractTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        res.status(200).json({
            success: true,
            data: template
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Update Template
exports.updateTemplate = async (req, res) => {
    try {
        const template = await ContractTemplate.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
            });
        }
        res.status(200).json({
            success: true,
            data: template
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Delete Template (Soft delete)
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await ContractTemplate.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template not found'
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
