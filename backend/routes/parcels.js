const express = require('express');
const router = express.Router();
const {
    createParcel,
    getParcels,
    getParcel,
    updateParcel,
    deleteParcel
} = require('../controllers/parcelController');
const auth = require('../middleware/auth');

router.route('/')
    .post(auth, createParcel)
    .get(auth, getParcels);

router.route('/:id')
    .get(auth, getParcel)
    .put(auth, updateParcel)
    .delete(auth, deleteParcel);

module.exports = router;
