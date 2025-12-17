
const express = require('express');
const router = express.Router();
const controller = require('../controllers/carbonContractController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sanitize original name to remove special chars
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload Route
router.post('/upload', auth, upload.array('contracts', 10), (req, res, next) => {
    if (req.files) {
        req.files.forEach(file => {
            try {
                fs.chmodSync(file.path, 0o644);
            } catch (err) {
                console.error('Error setting permissions for file:', file.path, err);
            }
        });
    }
    next();
}, controller.uploadContract);

// CRUD Routes
router.post('/', auth, controller.create);
router.get('/', auth, controller.getAll);
router.get('/:id', auth, controller.getById);
router.delete('/:id', auth, controller.delete);

// Chat with AI
router.post('/chat', auth, controller.chat);

module.exports = router;
