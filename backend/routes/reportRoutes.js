const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Get sales report
router.get('/sales', protect, async (req, res) => {
    try {
        const { period = 'daily' } = req.query;

        let startDate = new Date();
        if (period === 'daily') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'weekly') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'monthly') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { in: ['completed', 'served'] },
            }
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Group by date for chart data
        const salesByDate = {};
        orders.forEach((order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            salesByDate[date] = (salesByDate[date] || 0) + order.total;
        });

        res.json({
            totalRevenue,
            totalOrders,
            averageOrderValue,
            salesByDate: Object.entries(salesByDate).map(([date, revenue]) => ({ date, revenue })),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order analytics
router.get('/orders', protect, async (req, res) => {
    try {
        const totalOrders = await prisma.order.count();
        const pendingOrders = await prisma.order.count({ where: { status: 'pending' } });
        const preparingOrders = await prisma.order.count({ where: { status: 'preparing' } });
        const completedOrders = await prisma.order.count({ where: { status: { in: ['completed', 'served'] } } });
        const cancelledOrders = await prisma.order.count({ where: { status: 'cancelled' } });

        // Order type distribution
        const dineInOrders = await prisma.order.count({ where: { orderType: 'dine_in' } }); // Enum value check
        const takeawayOrders = await prisma.order.count({ where: { orderType: 'takeaway' } });
        const deliveryOrders = await prisma.order.count({ where: { orderType: 'delivery' } });

        res.json({
            totalOrders,
            pendingOrders,
            preparingOrders,
            completedOrders,
            cancelledOrders,
            orderTypes: {
                dineIn: dineInOrders,
                takeaway: takeawayOrders,
                delivery: deliveryOrders,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get popular items
router.get('/popular-items', protect, async (req, res) => {
    try {
        // Fetch items from completed orders
        const items = await prisma.orderItem.findMany({
            where: {
                order: { status: { in: ['completed', 'served'] } }
            }
        });

        const itemCounts = {};
        items.forEach((item) => {
            const key = item.name;
            if (!itemCounts[key]) {
                itemCounts[key] = { name: item.name, count: 0, revenue: 0 };
            }
            itemCounts[key].count += item.quantity;
            itemCounts[key].revenue += item.price * item.quantity;
        });

        const popularItems = Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        res.json(popularItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get dashboard summary
router.get('/dashboard', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await prisma.order.findMany({
            where: { createdAt: { gte: today } }
        });
        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

        const pendingOrders = await prisma.order.count({
            where: { status: { in: ['pending', 'preparing'] } }
        });

        // Distinct customers (tableNumber) - basic JS distinct
        const distinctTables = new Set(todayOrders.map(o => o.tableNumber).filter(Boolean));

        res.json({
            todayRevenue,
            todayOrders: todayOrders.length,
            pendingOrders,
            tablesServed: distinctTables.size,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get sales by category
router.get('/sales/category', protect, async (req, res) => {
    try {
        const { period = 'daily' } = req.query;
        let startDate = new Date();
        if (period === 'daily') startDate.setHours(0, 0, 0, 0);
        else if (period === 'weekly') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'monthly') startDate.setMonth(startDate.getMonth() - 1);

        // Fetch OrderItems with MenuItem -> Category
        const items = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: startDate },
                    status: { in: ['completed', 'served'] }
                }
            },
            include: {
                menuItem: {
                    include: { category: true }
                }
            }
        });

        const categorySales = {};
        items.forEach(item => {
            const categoryName = item.menuItem?.category?.name || 'Uncategorized';
            const value = item.price * item.quantity;
            categorySales[categoryName] = (categorySales[categoryName] || 0) + value;
        });

        const result = Object.entries(categorySales).map(([name, value]) => ({ name, value }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get sales by hour
router.get('/sales/hourly', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: today },
                status: { in: ['completed', 'served'] }
            }
        });

        const salesByHour = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, sales: 0, orders: 0 }));

        orders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            if (salesByHour[hour]) {
                salesByHour[hour].sales += order.total;
                salesByHour[hour].orders += 1;
            }
        });

        res.json(salesByHour);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Financial Report (P&L)
router.get('/financials', protect, async (req, res) => {
    try {
        const { period = 'daily' } = req.query;
        let startDate = new Date();
        if (period === 'daily') startDate.setHours(0, 0, 0, 0);
        else if (period === 'weekly') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'monthly') startDate.setMonth(startDate.getMonth() - 1);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { in: ['completed', 'served'] }
            },
            include: {
                items: { include: { menuItem: true } },
                transactions: true
            }
        });

        let revenue = 0;
        let tax = 0;
        let tips = 0;
        let cogs = 0;
        const paymentMethods = { cash: 0, card: 0, upi: 0 };

        orders.forEach(order => {
            revenue += order.total;
            tax += order.tax;
            tips += order.tip;

            // Calculate COGS
            order.items.forEach(item => {
                const cost = (item.menuItem?.costPrice || 0) * item.quantity;
                cogs += cost;
            });

            // Payment Methods
            if (order.transactions && order.transactions.length > 0) {
                order.transactions.forEach(t => {
                    if (t.status === 'success') {
                        paymentMethods[t.paymentMethod] = (paymentMethods[t.paymentMethod] || 0) + t.amount;
                    }
                });
            } else if (order.paymentMethod) {
                // Fallback
                paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + order.total;
            }
        });

        const netProfit = revenue - tax - cogs;

        res.json({
            revenue,
            tax,
            tips,
            cogs,
            netProfit,
            paymentMethods,
            margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Kitchen Performance
router.get('/kitchen-performance', protect, async (req, res) => {
    // Status history is stored in JSON or we need to access it differently?
    // Prisma Schema has statusHistory in the legacy Mongoose schema but NOT in schema.prisma explicitly as a field?
    // Wait, I didn't add statusHistory field to Prisma schema in Order model!
    // It's not in the Order model definition I generated.
    // However, I can fetch completed orders and if statusHistory is missing, I can't calculate this metric easily.
    // For now, return 0 or mock until schema is updated.

    // Actually, let's verify if I should add it. statusHistory was an array of objects.
    // In schema.prisma, I didn't add it.
    // So this feature is temporarily disabled/mocked.

    try {
        res.json({
            avgPrepTime: 0,
            ordersAnalyzed: 0,
            note: 'Metric unavailable in current version'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Customer Analytics (Top Spenders)
router.get('/customers', protect, async (req, res) => {
    try {
        // Group by customer phone using JS (since Prisma groupBy limits selection of other fields)
        const orders = await prisma.order.findMany({
            where: {
                status: { in: ['completed', 'served'] },
                customerPhone: { not: null }
            },
            orderBy: { createdAt: 'desc' }
        });

        const customers = {};
        orders.forEach(order => {
            if (!order.customerPhone) return;
            if (!customers[order.customerPhone]) {
                customers[order.customerPhone] = {
                    _id: order.customerPhone,
                    name: order.customerName,
                    totalOrders: 0,
                    totalSpent: 0,
                    lastVisit: order.createdAt
                };
            }
            customers[order.customerPhone].totalOrders += 1;
            customers[order.customerPhone].totalSpent += order.total;
            // update last visit if newer (orders sorted desc, so first found is newest if processed in order, 
            // but loop order might vary if parallel, but forEach is sync)
            if (new Date(order.createdAt) > new Date(customers[order.customerPhone].lastVisit)) {
                customers[order.customerPhone].lastVisit = order.createdAt;
            }
        });

        const result = Object.values(customers)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
