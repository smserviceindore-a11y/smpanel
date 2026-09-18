const { body } = require('express-validator');

const createProjectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('shortDescription').optional().trim().isLength({ max: 200 }),
  body('category').optional().isMongoId().withMessage('Invalid category ID'),
  body('status').optional().isIn(['draft', 'published', 'featured', 'archived']),
  body('tier').optional().isInt({ min: 1, max: 3 }),
];

const updateProjectValidation = [
  body('title').optional().trim().notEmpty(),
  body('category').optional().isMongoId(),
  body('status').optional().isIn(['draft', 'published', 'featured', 'archived']),
];

const updateStatusValidation = [
  body('status').optional().isIn(['draft', 'published', 'featured', 'archived']),
  body('featured').optional().isBoolean(),
];

module.exports = {
  createProjectValidation,
  updateProjectValidation,
  updateStatusValidation,
};
