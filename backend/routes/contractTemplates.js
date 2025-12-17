const express = require('express');
const router = express.Router();
const {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate
} = require('../controllers/contractTemplateController');
const auth = require('../middleware/auth');

router.route('/')
    .post(auth, createTemplate)
    .get(auth, getTemplates);

router.route('/:id')
    .get(auth, getTemplate)
    .put(auth, updateTemplate)
    .delete(auth, deleteTemplate);

module.exports = router;
