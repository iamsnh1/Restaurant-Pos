const { prisma } = require('../config/db');

// Helper to generate order number
const generateOrderNumber = async () => {
    const count = await prisma.order.count();
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const { status, date } = req.query;
        const where = {};

        if (status) where.status = status;
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.createdAt = { gte: startOfDay, lte: endOfDay };
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        menuItem: {
                            select: { name: true, price: true }
                        }
                    }
                },
                createdBy: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Map for compatibility if needed (flatten customer, map id -> _id)
        const mappedOrders = orders.map(order => ({
            ...order,
            _id: order.id,
            items: order.items.map(i => ({ ...i, menuItem: { ...i.menuItem, _id: i.menuItemId } }))
        }));

        res.json(mappedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        menuItem: {
                            select: { name: true, price: true, image: true, id: true }
                        }
                    }
                },
                createdBy: { select: { name: true } }
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Reconstruct customer object for frontend compatibility if needed
        const customer = {
            name: order.customerName,
            phone: order.customerPhone,
            email: order.customerEmail,
            gstin: order.customerGstin
        };

        res.json({ ...order, _id: order.id, customer });
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

        // Map frontend orderType (dine-in) to Prisma enum (dine_in)
        const normalizedOrderType = orderType === 'dine-in' ? 'dine_in' : (orderType || 'dine_in');

        // Calculate totals
        // Ensure items have price. If relying on frontend, risky. Ideally fetch from DB.
        // Assuming frontend sends name/price for now (Snapshot approach).
        const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const taxRate = 0.05; // 5% tax
        const tax = subtotal * taxRate;
        const total = subtotal + tax - (discount || 0);

        const orderNumber = await generateOrderNumber();

        const createdOrder = await prisma.order.create({
            data: {
                orderNumber,
                orderType: normalizedOrderType,
                tableNumber: tableNumber ? parseInt(tableNumber) : null,
                subtotal,
                tax,
                discount: discount || 0,
                total,
                status: 'pending',
                createdById: req.user.id, // req.user populated by auth middleware (check if it has id)

                // Map customer details
                customerName: customer?.name,
                customerPhone: customer?.phone,
                customerEmail: customer?.email,
                customerGstin: customer?.gstin,

                billingDetails: {
                    itemTotal: subtotal,
                    taxableAmount: subtotal - (discount || 0),
                    totalTax: tax,
                    grandTotal: total,
                    discountAmount: discount || 0,
                },

                // Create OrderItems
                items: {
                    create: items.map(item => ({
                        menuItemId: item.menuItem || item.menuItemId, // ID from cart
                        quantity: item.quantity,
                        name: item.name,
                        price: Number(item.price),
                        variant: item.variant,
                        specialInstructions: item.specialInstructions,
                        status: 'pending'
                    }))
                }
            },
            include: { items: { include: { menuItem: { select: { name: true } } } } }
        });

        // Emit new order so kitchen gets it instantly (broadcast to all + room so it works even before kitchen joins room)
        const io = req.app.get('io');
        if (io) {
            const kitchenOrder = {
                ...createdOrder,
                _id: createdOrder.id,
                id: createdOrder.id,
                orderType: normalizedOrderType === 'dine_in' ? 'dine-in' : normalizedOrderType,
                status: 'pending', // Ensure status is pending for kitchen
                items: (createdOrder.items || []).map(i => ({
                    ...i,
                    _id: i.id,
                    id: i.id,
                    name: i.name || i.menuItem?.name,
                    quantity: i.quantity,
                    price: i.price,
                    notes: i.specialInstructions,
                })),
            };
            console.log(`[ORDER] Emitting newOrder to kitchen. Order ID: ${createdOrder.id}, OrderNumber: ${orderNumber}, Status: ${kitchenOrder.status}`);
            console.log(`[ORDER] Kitchen order items count: ${kitchenOrder.items.length}`);
            const kitchenRoomSize = io.sockets.adapter.rooms.get('kitchen')?.size || 0;
            console.log(`[ORDER] Kitchen room has ${kitchenRoomSize} clients`);
            io.to('kitchen').emit('newOrder', kitchenOrder);
            io.emit('newOrder', kitchenOrder); // broadcast to all so kitchen gets it even if not in room yet
            io.to('pos').emit('orderCreated', { ...createdOrder, _id: createdOrder.id });
            console.log(`[ORDER] Emitted to kitchen room (${kitchenRoomSize} clients) and broadcast to all`);
        } else {
            console.error('[ORDER] Socket.io not available! Cannot emit newOrder');
        }

        const response = {
            ...createdOrder,
            _id: createdOrder.id,
            items: createdOrder.items.map(i => ({
                ...i,
                _id: i.id,
                menuItem: i.menuItem ? { ...i.menuItem, _id: i.menuItemId } : undefined
            }))
        };
        res.status(201).json(response);
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
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status },
            include: { items: true }
        });

        // Emit status update
        const io = req.app.get('io');
        if (io) {
            io.to('kitchen').emit('orderStatusUpdate', { ...order, _id: order.id });
            io.to('pos').emit('orderStatusUpdate', { ...order, _id: order.id });
        }

        res.json({ ...order, _id: order.id });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update payment status
// @route   PUT /api/orders/:id/payment
// @access  Private
const updatePayment = async (req, res) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;
        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                paymentStatus,
                paymentMethod,
                status: 'completed'
            },
            include: { items: true }
        });

        // Emit payment update
        const io = req.app.get('io');
        if (io) {
            io.to('kitchen').emit('orderCompleted', { ...order, _id: order.id });
            io.to('pos').emit('orderCompleted', { ...order, _id: order.id });
        }

        res.json({ ...order, _id: order.id });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get kitchen orders (pending and preparing)
// @route   GET /api/orders/kitchen
// @access  Private
const getKitchenOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['pending', 'preparing', 'ready'] } // Prisma 'in' filter
            },
            include: {
                items: {
                    include: {
                        menuItem: { select: { name: true, preparationTime: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`[KITCHEN API] Found ${orders.length} orders for kitchen`);
        const mappedOrders = orders.map(o => ({
            ...o,
            _id: o.id,
            id: o.id,
            orderType: o.orderType === 'dine_in' ? 'dine-in' : o.orderType,
            items: (o.items || []).map(i => ({
                ...i,
                _id: i.id,
                id: i.id,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
            }))
        }));
        console.log(`[KITCHEN API] Returning ${mappedOrders.length} mapped orders`);
        res.json(mappedOrders);
    } catch (error) {
        console.error('[KITCHEN API] Error:', error);
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
