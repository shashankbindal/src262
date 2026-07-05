'use strict';
const express = require('express');
const ctrl = require('../controllers/contact.controller');
const { globalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public route for submitting contact form
router.post('/', globalLimiter, ctrl.submitContactMessage);

module.exports = router;
