const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const os = require('os');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Accept images, documents, etc.
  if (file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB per file
  }
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/upload', upload.array('files'), attachmentController.uploadAttachments);
router.get('/:attachmentId/download', attachmentController.downloadAttachment);
router.delete('/:attachmentId', attachmentController.deleteAttachment);

module.exports = router;