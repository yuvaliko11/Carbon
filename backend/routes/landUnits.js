const express = require('express');
const router = express.Router();
const {
    createLandUnit,
    getLandUnits,
    getLandUnit,
    updateLandUnit,
    deleteLandUnit
} = require('../controllers/landUnitController');
const auth = require('../middleware/auth');

router.route('/')
    .post(auth, createLandUnit)
    .get(auth, getLandUnits);

router.route('/:id')
    .get(auth, getLandUnit)
    .put(auth, updateLandUnit)
    .delete(auth, deleteLandUnit);

module.exports = router;
