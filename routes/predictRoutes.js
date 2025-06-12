const express = require('express');
const router = express.Router();
const { predict } = require('../controllers/predictController');
const authMiddleware = require('../middleware/authMiddleware');

console.log('Memuat predictRoutes.js');

router.post('/', (req, res, next) => {
  console.log('Mencapai rute /predict');
  next();
}, authMiddleware, predict);

module.exports = router;