'use strict';
const express = require('express');
const ctrl    = require('../controllers/announcement.controller');

const router = express.Router();

/* Public — no auth required to browse announcements */
router.get('/latest', ctrl.getLatestAnnouncement);
router.get('/',       ctrl.getAnnouncements);

module.exports = router;
