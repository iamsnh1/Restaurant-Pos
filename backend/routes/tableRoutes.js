const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Get all tables
router.get('/', protect, async (req, res) => {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { number: 'asc' },
            // include: { currentOrder: true } // Mongoose had ref, Prisma needs relation logic if required.
            // For now, Table model in schema didn't have currentOrderId. If needed, add it.
        });
        res.json(tables.map(t => ({ ...t, _id: t.id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a table
router.post('/', protect, async (req, res) => {
    try {
        const table = await prisma.table.create({
            data: req.body
        });
        res.status(201).json({ ...table, _id: table.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update table status
router.put('/:id', protect, async (req, res) => {
    try {
        const table = await prisma.table.update({
            where: { id: req.params.id },
            data: req.body
        });

        // Emit table status update
        const io = req.app.get('io');
        if (io) {
            io.to('pos').emit('tableUpdate', { ...table, _id: table.id });
        }

        res.json({ ...table, _id: table.id });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Delete table
router.delete('/:id', protect, async (req, res) => {
    try {
        await prisma.table.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Table deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Seed default tables
router.post('/seed', protect, async (req, res) => {
    try {
        await prisma.table.deleteMany({});
        const tables = [];
        for (let i = 1; i <= 12; i++) {
            tables.push({
                number: i,
                capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
                status: 'available',
                // position: { x: ((i - 1) % 4) * 150, y: Math.floor((i - 1) / 4) * 120 }, // Model doesn't have position/shape in schema yet
                // shape: i % 3 === 0 ? 'round' : 'square',
                section: 'Main'
            });
        }
        // Prisma createMany is supported
        await prisma.table.createMany({
            data: tables
        });
        const created = await prisma.table.findMany();
        res.status(201).json(created.map(t => ({ ...t, _id: t.id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
