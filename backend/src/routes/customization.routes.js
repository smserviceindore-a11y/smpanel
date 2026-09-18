const express = require('express');
const { createCustomizationRequest } = require('../controllers/customization.controller');
const { createCustomizationValidation } = require('../validators/customization.validator');
const validate = require('../middleware/validate.middleware');
const { formRateLimit } = require('../middleware/rateLimit.middleware');
const optionalAuth = require('../middleware/optionalAuth.middleware');

const router = express.Router();

router.post('/', formRateLimit, optionalAuth, createCustomizationValidation, validate, createCustomizationRequest);

module.exports = router;
