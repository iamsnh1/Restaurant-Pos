const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/authMiddleware');

// Calculate Bill (Preview)
router.post('/calculate', protect, async (req, res) => {
    try {
        const { orderId, discountType, discountValue } = req.body;
        console.log(`[Calculate] Request for Order: ${orderId}`);

        const order = await Order.findById(orderId).populate('items.menuItem');
        if (!order) {
            console.log('[Calculate] Order not found');
            return res.status(404).json({ message: 'Order not found' });
        }
        console.log(`[Calculate] Order Found: ${order.orderNumber}, Items: ${order.items.length}`);

        const settings = await Settings.findOne();
        console.log(`[Calculate] Settings Found: ${!!settings}`);
        const taxRates = settings?.financials?.taxRates || [];

        // 1. Calculate Item Total
        let itemTotal = 0;
        order.items.forEach(item => {
            const lineTotal = (item.price || 0) * (item.quantity || 0);
            console.log(`[Calculate] Item: ${item.name}, Price: ${item.price}, Qty: ${item.quantity}, Line: ${lineTotal}`);
            itemTotal += lineTotal;
        });
        console.log(`[Calculate] Item Total: ${itemTotal}`);

        // 2. Calculate Discount
        let discountAmount = 0;
        if (discountType === 'percent') {
            discountAmount = (itemTotal * discountValue) / 100;
        } else if (discountType === 'flat') {
            discountAmount = discountValue;
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, itemTotal);

        const taxableAmount = itemTotal - discountAmount;

        // 3. Calculate Taxes
        const taxDetails = [];
        let totalTax = 0;

        taxRates.forEach(tax => {
            const taxAmount = (taxableAmount * tax.rate) / 100;
            taxDetails.push({
                name: tax.name,
                rate: tax.rate,
                amount: parseFloat(taxAmount.toFixed(2))
            });
            totalTax += taxAmount;
        });

        // 4. Final Calculation
        let grandTotalRaw = taxableAmount + totalTax;
        const grandTotal = Math.round(grandTotalRaw); // Basic Rounding
        const roundOff = parseFloat((grandTotal - grandTotalRaw).toFixed(2));

        const billingDetails = {
            itemTotal,
            discountAmount,
            discountType,
            discountValue,
            taxDetails,
            taxableAmount,
            totalTax: parseFloat(totalTax.toFixed(2)),
            roundOff,
            grandTotal
        };

        console.log(`[Calculate] Success. GrandTotal: ${grandTotal}`);
        res.json(billingDetails);

    } catch (error) {
        console.error('[Calculate] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Process Payment
router.post('/pay', protect, async (req, res) => {
    try {
        const { orderId, paymentMethod, amount, transactionId, isFullPayment, billingDetails, customer } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Update Customer Details if provided
        if (customer) {
            order.customer = { ...order.customer, ...customer };
        }

        // Update Billing Details if provided (to lock in the calculated values)
        if (billingDetails) {
            order.billingDetails = { ...order.billingDetails, ...billingDetails };
            order.total = billingDetails.grandTotal; // Sync legacy total field
        }

        // Add Transaction
        const newTransaction = {
            amount,
            paymentMethod,
            transactionId,
            status: 'success',
            timestamp: new Date()
        };
        order.transactions.push(newTransaction);

        // Update root payment method for easy access/analytics
        if (!order.paymentMethod) {
            order.paymentMethod = paymentMethod;
        } else if (order.paymentMethod !== paymentMethod) {
            order.paymentMethod = 'split'; // Or handle mixed methods
        }

        // Calculate Totals Paid
        const totalPaid = order.transactions.reduce((sum, txn) => sum + txn.amount, 0);

        // Update Status
        if (totalPaid >= order.billingDetails.grandTotal - 0.5) { // Tolerance for float
            order.paymentStatus = 'paid';
            order.status = 'completed'; // Auto-complete order on payment? Usually yes for POS.
        } else {
            order.paymentStatus = 'partially_paid';
        }

        await order.save();
        res.json(order);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Invoice Data
router.get('/:id/invoice', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.menuItem')
            .populate('createdBy', 'name');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const settings = await Settings.findOne();

        res.json({
            order,
            restaurant: settings?.restaurant,
            receiptConfig: settings?.receipt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
