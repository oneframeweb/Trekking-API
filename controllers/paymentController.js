const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const PromoCode = require('../models/PromoCode');

const createOrder = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: 'INR',
            receipt: `receipt_${bookingId}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(201).json(order);
    } catch (error) {
        console.error("RAZORPAY ORDER FAILURE:", error);
        res.status(500).json({ message: error.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const booking = await Booking.findById(bookingId);
            if (!booking) return res.status(404).json({ message: "Booking not found" });

            const trip = await Trip.findById(booking.tripId);
            if (trip) {
                trip.availableSeats -= booking.seats;
                await trip.save();
            }

            booking.paymentStatus = 'Completed';
            booking.bookingStatus = 'Confirmed';
            booking.paymentId = razorpay_payment_id;
            booking.orderId = razorpay_order_id;
            await booking.save();

            const payment = new Payment({
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                amount: booking.totalAmount * 100,
                bookingId: booking._id
            });
            await payment.save();

            // High-Fidelity Promo Usage Increment
            if (booking.promoCode) {
                await PromoCode.findOneAndUpdate(
                    { code: booking.promoCode.toUpperCase() },
                    { $inc: { usedCount: 1 } }
                );
            }

            res.status(200).json({ message: "Payment verified successfully", bookingId: booking._id });
        } else {
            res.status(400).json({ message: "Invalid signature" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate('bookingId').sort({ createdAt: -1 });
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createOrder, verifyPayment, getPayments };
