const { body, validationResult } = require('express-validator');

// Validation rules for user registration
exports.registerValidator = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('email')
    .optional()
    .trim(),
  body('username')
    .optional()
    .trim(),
  body('firstName')
    .optional()
    .trim(),
  body('lastName')
    .optional()
    .trim(),
  body('avatar')
    .optional()
];

// Validation rules for user login
exports.loginValidator = [
  body('email')
    .exists()
    .withMessage('Email or username is required')
    .trim(),
  body('password')
    .exists()
    .withMessage('Password is required')
];

// Validation rules for sending email
exports.sendEmailValidator = [
  body('to').custom((val) => {
    if (!val) throw new Error('Recipient email is required');
    const emails = Array.isArray(val) ? val : (typeof val === 'string' ? val.split(',') : []);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      const trimmed = email.trim();
      if (!trimmed || !emailRegex.test(trimmed)) {
        throw new Error(`Invalid recipient email address: ${trimmed}`);
      }
    }
    return true;
  }),
  body('subject').optional().isString(),
  body('body').optional().isString()
];

// Validation rules for updating user profile
exports.updateProfileValidator = [
  body('username').optional().isLength({ min: 2, max: 30 }),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('avatar').optional()
];

// Validation rules for updating storage limit
exports.updateStorageLimitValidator = [
  body('limitBytes').isInt({ min: 1048576 }) // Minimum 1MB
];

// Middleware to validate requests
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0]?.msg || 'Validation failed';
    return res.status(400).json({ message: firstError, errors: errors.array() });
  }
  next();
};