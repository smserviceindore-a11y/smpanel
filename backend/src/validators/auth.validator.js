const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['client', 'developer']).withMessage('Role must be client or developer'),
  body('phone').optional().trim(),
  body('company').optional().trim(),
];

module.exports = { loginValidation, registerValidation };
