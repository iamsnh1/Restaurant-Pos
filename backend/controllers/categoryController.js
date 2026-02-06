const { prisma } = require('../config/db');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        // Map id to _id for frontend (POS expects _id)
        const mapped = categories.map(c => ({ ...c, _id: c.id }));
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { name, description, image, order } = req.body;
        const category = await prisma.category.create({
            data: {
                name,
                description,
                image,
                order: order ? parseInt(order) : 0,
            },
        });
        const io = req.app.get('io');
        if (io) io.to('pos').emit('menuSync');
        res.status(201).json({ ...category, _id: category.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: req.body,
        });
        const io = req.app.get('io');
        if (io) io.to('pos').emit('menuSync');
        res.json({ ...category, _id: category.id });
    } catch (error) {
        // Handle record not found
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        await prisma.category.delete({
            where: { id: req.params.id },
        });
        const io = req.app.get('io');
        if (io) io.to('pos').emit('menuSync');
        res.json({ message: 'Category removed' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
