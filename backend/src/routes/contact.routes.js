const express = require('express');
const { createContact } = require('../controllers/contact.controller');
const { formRateLimit } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/', formRateLimit, createContact);

module.exports = router;
