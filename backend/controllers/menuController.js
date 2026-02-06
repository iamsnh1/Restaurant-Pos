const { prisma } = require('../config/db');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res) => {
    try {
        const { category } = req.query;
        // In Prisma, filtering by related ID is specific
        // Ensure category is passed correctly if filtering
        const where = { isAvailable: true };
        if (category) {
            where.categoryId = category;
        }

        const items = await prisma.menuItem.findMany({
            where,
            include: { category: true },
        });

        // Transform for frontend if needed? 
        // Frontend likely expects `category.name` which is available
        // Mongoose populated returned full category object. Prisma include does too.
        // We might need to map `id` to `_id`?
        const mappedItems = items.map(item => ({
            ...item,
            _id: item.id,
            category: { ...item.category, _id: item.category?.id }
        }));

        res.json(mappedItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItem = async (req, res) => {
    try {
        const item = await prisma.menuItem.findUnique({
            where: { id: req.params.id },
            include: { category: true },
        });
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json({ ...item, _id: item.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a menu item
// @route   POST /api/menu
// @access  Private/Admin
const createMenuItem = async (req, res) => {
    try {
        // req.body contains category (ID)
        // We need to map it to categoryId or connect
        // Mongoose: category: ObjectId
        // Prisma: data: { category: { connect: { id: ... } } } OR categoryId: ...

        const { category, ...rest } = req.body;

        const item = await prisma.menuItem.create({
            data: {
                ...rest,
                category: { connect: { id: category } },
                // Defaults handled by schema
            },
            include: { category: true }
        });

        const io = req.app.get('io');
        if (io) io.to('pos').emit('menuSync');
        res.status(201).json({ ...item, _id: item.id });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin
const updateMenuItem = async (req, res) => {
    try {
        const { category, ...rest } = req.body;
        const data = { ...rest };

        if (category) {
            data.category = { connect: { id: category } }; // Or just set categoryId
            // If category is string ID, we can do data.categoryId = category
            // But if it's object, handle it. Assuming string ID from frontend form.
            // Let's use clean approach:
            delete data.category;
            data.categoryId = category;
        }

        const item = await prisma.menuItem.update({
            where: { id: req.params.id },
            data,
            include: { category: true }
        });
        const io = req.app.get('io');
        if (io) io.to('pos').emit('menuSync');
        res.json({ ...item, _id: item.id });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
const deleteMenuItem = async (req, res) => {
    try {
        await prisma.menuItem.delete({
            where: { id: req.params.id },
        });
        const io = req.app.get('io');
        if (io) io.to('pos').emit('menuSync');
        res.json({ message: 'Menu item removed' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
};
