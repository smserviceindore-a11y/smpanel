const { body } = require('express-validator');

const createCustomizationValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('projectId').isMongoId().withMessage('Valid project ID is required'),
  body('selectedModules').optional().isArray(),
  body('additionalRequirements').optional().trim(),
  body('budget').optional().trim(),
  body('timeline').optional().trim(),
];

module.exports = { createCustomizationValidation };
