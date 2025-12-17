const CarbonProject = require('../models/CarbonProject');
const CarbonCreditBatch = require('../models/CarbonCreditBatch');
const CarbonDeal = require('../models/CarbonDeal');

// --- Projects ---
exports.createProject = async (req, res) => {
    try {
        const project = await CarbonProject.create(req.body);
        res.status(201).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const projects = await CarbonProject.find().populate('leases');
        res.status(200).json({ success: true, data: projects });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getProject = async (req, res) => {
    try {
        const project = await CarbonProject.findById(req.params.id).populate('leases');
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// --- Credit Batches ---
exports.createBatch = async (req, res) => {
    try {
        const batch = await CarbonCreditBatch.create(req.body);
        res.status(201).json({ success: true, data: batch });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getBatches = async (req, res) => {
    try {
        const batches = await CarbonCreditBatch.find({ project: req.params.projectId });
        res.status(200).json({ success: true, data: batches });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// --- Deals ---
exports.createDeal = async (req, res) => {
    try {
        const deal = await CarbonDeal.create(req.body);
        res.status(201).json({ success: true, data: deal });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getDeals = async (req, res) => {
    try {
        const deals = await CarbonDeal.find().populate('creditBatches.batch');
        res.status(200).json({ success: true, data: deals });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
