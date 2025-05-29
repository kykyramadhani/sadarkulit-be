const express = require('express');
const router = express.Router();
const { createHistory, getHistory } = require('../controllers/historyController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createHistory);
router.get('/', authMiddleware, getHistory);

module.exports = router;