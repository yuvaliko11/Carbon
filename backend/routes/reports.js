const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.get('/geojson', auth, reportController.getGeoJSON);
router.get('/sites-summary', auth, reportController.getSitesSummary);
router.get('/properties-summary', auth, reportController.getPropertiesSummary);

module.exports = router;
