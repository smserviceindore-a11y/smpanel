const express = require('express');
const { createRequirement } = require('../controllers/requirement.controller');
const { createRequirementValidation } = require('../validators/requirement.validator');
const validate = require('../middleware/validate.middleware');
const { formRateLimit } = require('../middleware/rateLimit.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');

const router = express.Router();

router.post('/', formRateLimit, optionalAuth, createRequirementValidation, validate, createRequirement);

module.exports = router;
