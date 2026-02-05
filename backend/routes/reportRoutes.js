const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
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

        const orders = await Order.find({
            createdAt: { $gte: startDate },
            status: { $in: ['completed', 'served'] },
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
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const preparingOrders = await Order.countDocuments({ status: 'preparing' });
        const completedOrders = await Order.countDocuments({ status: { $in: ['completed', 'served'] } });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        // Order type distribution
        const dineInOrders = await Order.countDocuments({ orderType: 'dine-in' });
        const takeawayOrders = await Order.countDocuments({ orderType: 'takeaway' });
        const deliveryOrders = await Order.countDocuments({ orderType: 'delivery' });

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
        const orders = await Order.find({ status: { $in: ['completed', 'served'] } });

        const itemCounts = {};
        orders.forEach((order) => {
            order.items.forEach((item) => {
                const key = item.name;
                if (!itemCounts[key]) {
                    itemCounts[key] = { name: item.name, count: 0, revenue: 0 };
                }
                itemCounts[key].count += item.quantity;
                itemCounts[key].revenue += item.price * item.quantity;
            });
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

        const todayOrders = await Order.find({ createdAt: { $gte: today } });
        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

        const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'preparing'] } });
        const totalCustomers = await Order.distinct('tableNumber');

        res.json({
            todayRevenue,
            todayOrders: todayOrders.length,
            pendingOrders,
            tablesServed: totalCustomers.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

// Get sales by category
router.get('/sales/category', protect, async (req, res) => {
    try {
        const { period = 'daily' } = req.query;
        let startDate = new Date();
        if (period === 'daily') startDate.setHours(0, 0, 0, 0);
        else if (period === 'weekly') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'monthly') startDate.setMonth(startDate.getMonth() - 1);

        const sales = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'served'] } } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: 'items.menuItem',
                    foreignField: '_id',
                    as: 'menuDetail'
                }
            },
            { $unwind: '$menuDetail' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'menuDetail.category',
                    foreignField: '_id',
                    as: 'categoryDetail'
                }
            },
            { $unwind: '$categoryDetail' },
            {
                $group: {
                    _id: '$categoryDetail.name',
                    value: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $project: { name: '$_id', value: 1, _id: 0 } }
        ]);

        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get sales by hour
router.get('/sales/hourly', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const hourlySales = await Order.aggregate([
            { $match: { createdAt: { $gte: today }, status: { $in: ['completed', 'served'] } } },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    sales: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill missing hours
        const result = Array.from({ length: 24 }, (_, i) => {
            const found = hourlySales.find(h => h._id === i);
            return { hour: `${i}:00`, sales: found ? found.sales : 0, orders: found ? found.orders : 0 };
        });

        res.json(result);
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

        const orders = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'served'] } } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: 'items.menuItem',
                    foreignField: '_id',
                    as: 'details'
                }
            },
            { $unwind: '$details' },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$total' }, // This logic is slightly flawed as total is per order, not per item. Fixing below.
                }
            }
        ]);

        // Correct approach for Financials
        const financials = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'served'] } } },
            {
                $project: {
                    revenue: '$total',
                    tax: '$tax',
                    tip: '$tip',
                    items: 1
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: 'items.menuItem',
                    foreignField: '_id',
                    as: 'menuItem'
                }
            },
            { $unwind: '$menuItem' },
            {
                $project: {
                    revenue: 1,
                    tax: 1,
                    tip: 1,
                    cost: { $multiply: [{ $ifNull: ['$menuItem.costPrice', 0] }, '$items.quantity'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $first: '$revenue' }, // revenue is duplicated per item unwind, need 2 passes or better logic.
                    // Doing 2 facets is safer.
                }
            }
        ]);

        // Simplified approach: Calculate Totals first, then Costs
        const revenueAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'served'] } } },
            { $group: { _id: null, revenue: { $sum: '$total' }, tax: { $sum: '$tax' }, tips: { $sum: '$tip' } } }
        ]);

        const costAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'served'] } } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: 'items.menuItem',
                    foreignField: '_id',
                    as: 'detail'
                }
            },
            { $unwind: '$detail' },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: { $multiply: [{ $ifNull: ['$detail.costPrice', 0] }, '$items.quantity'] } }
                }
            }
        ]);

        const revenue = revenueAgg[0]?.revenue || 0;
        const tax = revenueAgg[0]?.tax || 0;
        const tips = revenueAgg[0]?.tips || 0;
        const cogs = costAgg[0]?.totalCost || 0;
        const netProfit = revenue - tax - cogs; // Excluding operating expenses for now

        // Payment Method Breakdown
        const paymentMethodsAgg = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'served'] } } },
            // If transactions exist, use those (better for split payments)
            // Otherwise fallback to main paymentMethod
            {
                $project: {
                    useTransactions: { $gt: [{ $size: { $ifNull: ["$transactions", []] } }, 0] },
                    transactions: 1,
                    total: 1,
                    paymentMethod: 1
                }
            },
            {
                $facet: {
                    "fromTransactions": [
                        { $match: { useTransactions: true } },
                        { $unwind: "$transactions" },
                        { $group: { _id: "$transactions.paymentMethod", amount: { $sum: "$transactions.amount" } } }
                    ],
                    "fromLegacy": [
                        { $match: { useTransactions: false } },
                        { $group: { _id: "$paymentMethod", amount: { $sum: "$total" } } }
                    ]
                }
            },
            {
                $project: {
                    allPayments: { $concatArrays: ["$fromTransactions", "$fromLegacy"] }
                }
            },
            { $unwind: "$allPayments" },
            {
                $group: {
                    _id: "$allPayments._id",
                    amount: { $sum: "$allPayments.amount" }
                }
            }
        ]);

        const paymentMethods = paymentMethodsAgg.reduce((acc, curr) => {
            if (curr._id) acc[curr._id] = curr.amount;
            return acc;
        }, { cash: 0, card: 0, upi: 0 });

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
    try {
        const orders = await Order.find({
            status: { $in: ['ready', 'served', 'completed'] },
            statusHistory: { $exists: true, $not: { $size: 0 } }
        }).limit(100);

        let totalPrepTime = 0;
        let count = 0;

        orders.forEach(order => {
            const created = order.createdAt;
            const readyStatus = order.statusHistory.find(h => h.status === 'ready');
            if (readyStatus) {
                const diff = (new Date(readyStatus.timestamp) - new Date(created)) / 1000 / 60; // minutes
                if (diff > 0 && diff < 120) { // filter outliers
                    totalPrepTime += diff;
                    count++;
                }
            }
        });

        const avgPrepTime = count > 0 ? Math.round(totalPrepTime / count) : 0;

        res.json({
            avgPrepTime,
            ordersAnalyzed: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Customer Analytics (Top Spenders)
router.get('/customers', protect, async (req, res) => {
    try {
        const customers = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'served'] }, 'customer.phone': { $exists: true, $ne: '' } } },
            {
                $group: {
                    _id: '$customer.phone',
                    name: { $first: '$customer.name' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    lastVisit: { $max: '$createdAt' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 }
        ]);

        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
