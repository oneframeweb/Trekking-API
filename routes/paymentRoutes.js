const express = require('express');
const { createOrder, verifyPayment, getPayments } = require('../controllers/paymentController');

const router = express.Router();

router.get('/', getPayments);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
