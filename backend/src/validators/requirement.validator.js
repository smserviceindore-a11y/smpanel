const { body } = require('express-validator');

const createRequirementValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('company').optional().trim(),
  body('industry').optional().trim(),
  body('location').optional().trim(),
  body('projectType').optional().trim(),
  body('modules').optional().isArray(),
  body('budget').optional().trim(),
  body('timeline').optional().trim(),
  body('additionalNotes').optional().trim(),
];

module.exports = { createRequirementValidation };
