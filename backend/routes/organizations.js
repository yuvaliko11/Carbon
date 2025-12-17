const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');

// @route   GET api/organizations
// @desc    Get all organizations
// @access  Public
router.get('/', async (req, res) => {
    try {
        const organizations = await Organization.find();
        res.status(200).json({
            success: true,
            count: organizations.length,
            data: organizations
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
});

// @route   POST api/organizations
// @desc    Create an organization
// @access  Public
router.post('/', async (req, res) => {
    try {
        const organization = await Organization.create(req.body);
        res.status(201).json({
            success: true,
            data: organization
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;
