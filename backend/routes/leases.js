const express = require('express');
const router = express.Router();
const {
    createLease,
    getLeases,
    getLease,
    updateLease,
    delete: deleteLease,
    calculateTransferFee,
    cleanupOrphans,
    syncCarbonContracts
} = require('../controllers/leaseController');
const auth = require('../middleware/auth');

router.route('/')
    .post(auth, createLease)
    .get(auth, getLeases);

router.route('/:id/calculate-transfer-fee')
    .post(auth, calculateTransferFee);

router.route('/:id').get(getLease).put(updateLease).delete(deleteLease);

router.route('/sync/carbon-contracts').post(auth, syncCarbonContracts);
router.route('/cleanup/orphans').delete(cleanupOrphans);

module.exports = router;
