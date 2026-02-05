const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { protect } = require('../middleware/authMiddleware');

// Get all reservations
router.get('/', protect, async (req, res) => {
    try {
        const { date, status } = req.query;
        const filter = {};

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            filter.date = { $gte: startOfDay, $lte: endOfDay };
        }

        if (status) filter.status = status;

        const reservations = await Reservation.find(filter)
            .sort({ date: 1, time: 1 })
            .populate('createdBy', 'name');
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create reservation
router.post('/', protect, async (req, res) => {
    try {
        const reservation = await Reservation.create({
            ...req.body,
            createdBy: req.user._id,
        });

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.to('pos').emit('newReservation', reservation);
        }

        res.status(201).json(reservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update reservation
router.put('/:id', protect, async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.to('pos').emit('reservationUpdate', reservation);
        }

        res.json(reservation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete reservation
router.delete('/:id', protect, async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.json({ message: 'Reservation deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get today's reservations
router.get('/today', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const reservations = await Reservation.find({
            date: { $gte: today, $lt: tomorrow },
            status: { $nin: ['cancelled', 'no-show'] },
        }).sort({ time: 1 });

        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
