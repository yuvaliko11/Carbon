const express = require('express');
const router = express.Router();
const { getOrphans, cleanupOrphans } = require('../controllers/debugController');
const auth = require('../middleware/auth');

// Debug Routes - Protected by Auth
router.get('/orphans', auth, getOrphans);
router.post('/cleanup', auth, cleanupOrphans);

module.exports = router;
