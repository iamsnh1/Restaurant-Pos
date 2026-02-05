const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Shift = require('../models/Shift');
const { protect, admin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// --- Staff CRUD ---

// Create new staff member (Admin only)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, email, password, role, phone, hourlyRate, pin } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            phone,
            hourlyRate,
            pin
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
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
        const user = await User.findById(req.params.id);
        if (user) {
            // Prevent deleting the last admin if necessary, but basic delete for now
            await User.deleteOne({ _id: req.params.id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all staff (Admin/Manager only)
router.get('/', protect, async (req, res) => {
    try {
        const staff = await User.find({}).select('-password');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update staff member
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.phone = req.body.phone || user.phone;
            user.hourlyRate = req.body.hourlyRate || user.hourlyRate;
            user.pin = req.body.pin || user.pin;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
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

        // Check if already clocked in
        const existing = await Attendance.findOne({
            user: req.user._id,
            date: today,
            status: 'present'
        });

        if (existing) {
            return res.status(400).json({ message: 'Already clocked in' });
        }

        const attendance = await Attendance.create({
            user: req.user._id,
            date: today,
            clockIn: new Date(),
            status: 'present'
        });

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clock Out
router.post('/attendance/clock-out', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            user: req.user._id,
            status: 'present'
        });

        if (!attendance) {
            return res.status(400).json({ message: 'Not clocked in' });
        }

        attendance.clockOut = new Date();
        attendance.status = 'finished';

        // Calculate total hours
        const diff = attendance.clockOut - attendance.clockIn; // in ms
        attendance.totalHours = +(diff / (1000 * 60 * 60)).toFixed(2);

        await attendance.save();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Attendance History (Admin sees all, Staff sees own)
router.get('/attendance', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            query.user = req.user._id;
        }

        const records = await Attendance.find(query)
            .populate('user', 'name role')
            .sort({ date: -1 })
            .limit(100);

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Shifts ---

// Get Shifts
router.get('/shifts', protect, async (req, res) => {
    try {
        const shifts = await Shift.find({
            startTime: { $gte: new Date() } // Future shifts
        }).populate('user', 'name');
        res.json(shifts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Shift (Admin/Manager)
router.post('/shifts', protect, admin, async (req, res) => {
    try {
        const shift = await Shift.create({
            user: req.body.userId,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            notes: req.body.notes
        });
        const populated = await Shift.findById(shift._id).populate('user', 'name');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
