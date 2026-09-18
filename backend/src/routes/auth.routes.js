const express = require('express');
const { login, register, getMe } = require('../controllers/auth.controller');
const { loginValidation, registerValidation } = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', loginValidation, validate, login);
router.post('/register', registerValidation, validate, register);
router.get('/me', authMiddleware, getMe);

module.exports = router;
