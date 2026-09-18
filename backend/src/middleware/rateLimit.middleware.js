const rateLimit = require('express-rate-limit');

const formRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many requests. Please try again after a minute.',
  },
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

module.exports = { formRateLimit, apiRateLimit };
