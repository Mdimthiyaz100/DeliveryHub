const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardcontroller');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, dashboardController.getStats);

module.exports = router;