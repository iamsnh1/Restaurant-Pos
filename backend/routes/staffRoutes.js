const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, admin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// --- Staff CRUD ---

// Create new staff member (Admin only)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, email, password, role, phone, hourlyRate, pin } = req.body;

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'waiter', // Fallback
                phone,
                hourlyRate: hourlyRate || 0,
                pin
            }
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete staff member (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: 'User removed' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Get all staff (Admin/Manager only)
router.get('/', protect, async (req, res) => {
    try {
        const staff = await prisma.user.findMany();
        // Manually exclude password
        const staffSafe = staff.map(u => {
            const { password, ...rest } = u;
            return { ...rest, _id: u.id };
        });
        res.json(staffSafe);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update staff member
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });

        if (user) {
            const data = {
                name: req.body.name || user.name,
                email: req.body.email || user.email,
                role: req.body.role || user.role,
                phone: req.body.phone || user.phone,
                hourlyRate: req.body.hourlyRate || user.hourlyRate,
                pin: req.body.pin || user.pin
            };

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                data.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await prisma.user.update({
                where: { id: req.params.id },
                data
            });

            res.json({
                _id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Attendance ---

// Clock In (Any authenticated user)
router.post('/attendance/clock-in', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existing = await prisma.attendance.findFirst({
            where: {
                userId: req.user.id,
                date: today,
                status: 'present'
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Already clocked in' });
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId: req.user.id,
                date: today,
                clockIn: new Date(),
                status: 'present'
            }
        });

        res.status(201).json({ ...attendance, _id: attendance.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clock Out
router.post('/attendance/clock-out', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findFirst({
            where: {
                userId: req.user.id,
                status: 'present'
            }
        });

        if (!attendance) {
            return res.status(400).json({ message: 'Not clocked in' });
        }

        const clockOut = new Date();
        const diff = clockOut - new Date(attendance.clockIn); // in ms
        const totalHours = Number((diff / (1000 * 60 * 60)).toFixed(2));

        const updated = await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                clockOut,
                status: 'finished',
                totalHours
            }
        });

        res.json({ ...updated, _id: updated.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Attendance History (Admin sees all, Staff sees own)
router.get('/attendance', protect, async (req, res) => {
    try {
        const where = {};
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            where.userId = req.user.id;
        }

        const records = await prisma.attendance.findMany({
            where,
            include: {
                user: { select: { name: true, role: true } }
            },
            orderBy: { date: 'desc' },
            take: 100
        });

        res.json(records.map(r => ({ ...r, _id: r.id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Shifts ---

// Get Shifts
router.get('/shifts', protect, async (req, res) => {
    try {
        const shifts = await prisma.shift.findMany({
            where: {
                startTime: { gte: new Date() } // Future shifts
            },
            include: { user: { select: { name: true } } }
        });
        res.json(shifts.map(s => ({ ...s, _id: s.id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Shift (Admin/Manager)
router.post('/shifts', protect, admin, async (req, res) => {
    try {
        const shift = await prisma.shift.create({
            data: {
                userId: req.body.userId,
                startTime: new Date(req.body.startTime),
                endTime: new Date(req.body.endTime),
                notes: req.body.notes
            },
            include: { user: { select: { name: true } } }
        });
        res.status(201).json({ ...shift, _id: shift.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
