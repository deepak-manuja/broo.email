const { body, validationResult } = require('express-validator');

// Validation rules for user registration
exports.registerValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

// Validation rules for user login
exports.loginValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
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
  body('username').optional().isAlphanumeric().isLength({ min: 3, max: 30 })
];

// Validation rules for updating storage limit
exports.updateStorageLimitValidator = [
  body('limitBytes').isInt({ min: 1048576 }) // Minimum 1MB
];

// Middleware to validate requests
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};