'use strict';
const express  = require('express');
const ctrl     = require('../controllers/user.controller');
const { authenticate, requireVerifiedEmail } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { updateProfileValidator } = require('../validators/user.validators');

const router = express.Router();

router.use(authenticate);

router.get('/profile',    ctrl.getProfile);
router.patch('/profile',  requireVerifiedEmail, updateProfileValidator, validate, ctrl.updateProfile);

module.exports = router;
