const express = require('express');
const router = express.Router();
const {
    recordRentPayment,
    recordTransferFee,
    distributeCarbonRevenue,
    getLeaseTransactions
} = require('../controllers/financeController');
const auth = require('../middleware/auth');

router.post('/rent-payment', auth, recordRentPayment);
router.post('/transfer-fee', auth, recordTransferFee);
router.post('/carbon-revenue', auth, distributeCarbonRevenue);
router.get('/lease/:leaseId', auth, getLeaseTransactions);

module.exports = router;
