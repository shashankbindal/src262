'use strict';
const express = require('express');
const ctrl    = require('../controllers/event.controller');

const router = express.Router();

/* Public — no auth required to browse events */
router.get('/',            ctrl.getAllEvents);
router.get('/slug/:slug',  ctrl.getEventBySlug);
router.get('/:eventId',    ctrl.getEventById);

module.exports = router;
