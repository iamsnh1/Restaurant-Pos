const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Get all reservations
router.get('/', protect, async (req, res) => {
    try {
        const { date, status } = req.query;
        const where = {};

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.dateTime = { gte: startOfDay, lte: endOfDay };
        }

        if (status) where.status = status;

        const reservations = await prisma.reservation.findMany({
            where,
            orderBy: { dateTime: 'asc' },
            include: { table: true }
        });
        res.json(reservations.map(r => ({ ...r, _id: r.id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create reservation
router.post('/', protect, async (req, res) => {
    try {
        // Mongoose had `time` field potentially separate in req.body?
        // Assuming req.body has `dateTime` or we construct it.
        // If frontend sends 'date' and 'time', we might need to combine.
        // But usually standardizing on ISO dateTime is best.

        const reservation = await prisma.reservation.create({
            data: {
                customerName: req.body.customerName || req.body.name,
                customerPhone: req.body.customerPhone || req.body.phone,
                guests: req.body.guests ? parseInt(req.body.guests) : 2,
                dateTime: new Date(req.body.dateTime || req.body.date),
                status: req.body.status || 'confirmed',
                notes: req.body.notes,
                tableId: req.body.tableId,
                // createdBy field missing in simplified schema, ignoring.
            }
        });

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.to('pos').emit('newReservation', { ...reservation, _id: reservation.id });
        }

        res.status(201).json({ ...reservation, _id: reservation.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update reservation
router.put('/:id', protect, async (req, res) => {
    try {
        const reservation = await prisma.reservation.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                guests: req.body.guests ? parseInt(req.body.guests) : undefined, // Parse if present
                dateTime: req.body.dateTime ? new Date(req.body.dateTime) : undefined
            }
        });

        const io = req.app.get('io');
        if (io) {
            io.to('pos').emit('reservationUpdate', { ...reservation, _id: reservation.id });
        }

        res.json({ ...reservation, _id: reservation.id });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.status(400).json({ message: error.message });
    }
});

// Delete reservation
router.delete('/:id', protect, async (req, res) => {
    try {
        await prisma.reservation.delete({ where: { id: req.params.id } });
        res.json({ message: 'Reservation deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Reservation not found' });
        }
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

        const reservations = await prisma.reservation.findMany({
            where: {
                dateTime: { gte: today, lt: tomorrow },
                status: { notIn: ['cancelled', 'no-show'] },
            },
            orderBy: { dateTime: 'asc' }
        });

        res.json(reservations.map(r => ({ ...r, _id: r.id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
