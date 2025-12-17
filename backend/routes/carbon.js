const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    getProject,
    createBatch,
    getBatches,
    createDeal,
    getDeals
} = require('../controllers/carbonController');
const auth = require('../middleware/auth');

// Projects
router.route('/projects')
    .post(auth, createProject)
    .get(auth, getProjects);

router.route('/projects/:id')
    .get(auth, getProject);

// Batches
router.route('/projects/:projectId/batches')
    .post(auth, createBatch)
    .get(auth, getBatches);

// Deals
router.route('/deals')
    .post(auth, createDeal)
    .get(auth, getDeals);

module.exports = router;
