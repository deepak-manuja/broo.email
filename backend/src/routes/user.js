const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { updateProfileValidator, updateStorageLimitValidator, validate } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Routes
router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidator, validate, userController.updateProfile);
router.get('/storage', userController.getStorageUsage);
router.put('/storage/limit', updateStorageLimitValidator, validate, userController.updateStorageLimit);

module.exports = router;