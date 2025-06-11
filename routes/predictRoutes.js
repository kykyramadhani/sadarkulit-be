const express = require('express');
const router = express.Router();
const { predict } = require('../controllers/predictController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/predict', authMiddleware, predict);

module.exports = router;