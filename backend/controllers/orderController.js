const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const { status, date } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        const orders = await Order.find(filter)
            .populate('items.menuItem', 'name price')
            .populate('createdBy', 'name')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.menuItem', 'name price image')
            .populate('createdBy', 'name');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { orderType, tableNumber, items, customer, discount } = req.body;

        // Calculate totals
        const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const taxRate = 0.05; // 5% tax
        const tax = subtotal * taxRate;
        const total = subtotal + tax - (discount || 0);

        const order = await Order.create({
            orderType,
            tableNumber,
            items,
            subtotal,
            tax,
            discount: discount || 0,
            total,
            billingDetails: {
                itemTotal: subtotal,
                taxableAmount: subtotal - (discount || 0),
                totalTax: tax,
                grandTotal: total,
                discountAmount: discount || 0,
            },
            customer,
            status: 'pending',
            createdBy: req.user._id,
        });

        // Emit new order event to kitchen
        const io = req.app.get('io');
        if (io) {
            io.to('kitchen').emit('newOrder', order);
            io.to('pos').emit('orderCreated', order);
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Emit status update to all clients
        const io = req.app.get('io');
        if (io) {
            io.to('kitchen').emit('orderStatusUpdate', order);
            io.to('pos').emit('orderStatusUpdate', order);
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
const updatePayment = async (req, res) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { paymentStatus, paymentMethod, status: 'completed' },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Emit payment update
        const io = req.app.get('io');
        if (io) {
            io.to('kitchen').emit('orderCompleted', order);
            io.to('pos').emit('orderCompleted', order);
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get kitchen orders (pending and preparing)
// @route   GET /api/orders/kitchen
// @access  Private
const getKitchenOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            status: { $in: ['pending', 'preparing', 'ready'] },
        })
            .populate('items.menuItem', 'name preparationTime')
            .sort('createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    updatePayment,
    getKitchenOrders,
};
