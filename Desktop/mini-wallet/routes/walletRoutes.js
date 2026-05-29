const express = require('express');
const { getBalance, topUp, transfer } = require('../controllers/walletController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/balance', authMiddleware, getBalance);
router.post('/topup', authMiddleware, topUp);
router.post('/transfer', authMiddleware, transfer);

module.exports = router;