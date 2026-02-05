const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { protect } = require('../middleware/authMiddleware');

// Get all tables
router.get('/', protect, async (req, res) => {
    try {
        const tables = await Table.find().populate('currentOrder').sort('number');
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a table
router.post('/', protect, async (req, res) => {
    try {
        const table = await Table.create(req.body);
        res.status(201).json(table);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update table status
router.put('/:id', protect, async (req, res) => {
    try {
        const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }

        // Emit table status update
        const io = req.app.get('io');
        io.to('pos').emit('tableUpdate', table);

        res.json(table);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete table
router.delete('/:id', protect, async (req, res) => {
    try {
        const table = await Table.findByIdAndDelete(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json({ message: 'Table deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Seed default tables
router.post('/seed', protect, async (req, res) => {
    try {
        await Table.deleteMany({});
        const tables = [];
        for (let i = 1; i <= 12; i++) {
            tables.push({
                number: i,
                capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
                status: 'available',
                position: { x: ((i - 1) % 4) * 150, y: Math.floor((i - 1) / 4) * 120 },
                shape: i % 3 === 0 ? 'round' : 'square',
            });
        }
        const created = await Table.insertMany(tables);
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
