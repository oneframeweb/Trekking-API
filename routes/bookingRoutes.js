const express = require('express');
const { getAllBookings, createBooking, updateBookingStatus } = require('../controllers/bookingController');

const router = express.Router();

router.get('/', getAllBookings);
router.post('/', createBooking);
router.put('/:id', updateBookingStatus);

module.exports = router;
