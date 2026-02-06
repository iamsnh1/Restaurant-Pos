const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// Calculate Bill (Preview)
router.post('/calculate', protect, async (req, res) => {
    try {
        const { orderId, discountType, discountValue } = req.body;
        console.log(`[Calculate] Request for Order: ${orderId}`);

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } } }
        });

        if (!order) {
            console.log('[Calculate] Order not found');
            return res.status(404).json({ message: 'Order not found' });
        }
        console.log(`[Calculate] Order Found: ${order.orderNumber}, Items: ${order.items.length}`);

        const settings = await prisma.settings.findFirst();
        console.log(`[Calculate] Settings Found: ${!!settings}, ID: ${settings?.id}`);
        // Settings structure is { data: { ... } }
        const taxRates = settings?.data?.financials?.taxRates || [];

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

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { transactions: true } // Need to reduce previous transactions
        });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const updates = { billingDetails }; // Lock in billing details
        if (customer) {
            updates.customerName = customer.name;
            updates.customerPhone = customer.phone;
            updates.customerEmail = customer.email;
            updates.customerGstin = customer.gstin;
        }
        updates.total = billingDetails.grandTotal;

        // Determine Payment Status
        let paymentStatus = order.paymentStatus;
        // Calculate Totals Paid INCLUDING this new one
        const previousPaid = order.transactions.reduce((sum, txn) => sum + txn.amount, 0);
        const totalPaid = previousPaid + amount;

        if (totalPaid >= billingDetails.grandTotal - 0.5) {
            paymentStatus = 'paid';
            // Don't mark as completed - let kitchen mark it as served/completed
            // Only mark as completed if order was already served
            if (order.status === 'served') {
                updates.status = 'completed';
            }
        } else {
            paymentStatus = 'partially_paid';
        }

        updates.paymentStatus = paymentStatus;

        // Update root payment method
        if (!order.paymentMethod) {
            updates.paymentMethod = paymentMethod;
        } else if (order.paymentMethod !== paymentMethod) {
            updates.paymentMethod = 'split';
        }

        // Perform update with nested transaction creation
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                ...updates,
                transactions: {
                    create: {
                        amount,
                        paymentMethod,
                        transactionId,
                        status: 'success',
                        timestamp: new Date()
                    }
                }
            },
            include: { transactions: true }
        });

        console.log(`[Payment] Processed status: ${paymentStatus}, Total Paid now: ${totalPaid}/${billingDetails.grandTotal}`);
        res.json({ ...updatedOrder, _id: updatedOrder.id });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload Receipt PDF (store base64 and return download URL)
router.post('/receipt-pdf', protect, async (req, res) => {
    try {
        const { orderId, pdfBase64, fileName } = req.body;
        console.log(`[Receipt PDF] Request keys: ${Object.keys(req.body).join(', ')}`);
        console.log(`[Receipt PDF] Uploading for Order: ${orderId}, Filename: ${fileName}, Size: ${pdfBase64 ? pdfBase64.length : 'MISSING'}`);

        if (!orderId || !pdfBase64) {
            console.error('[Receipt PDF] Validation failed: Missing orderId or pdfBase64');
            return res.status(400).json({ message: 'Order ID and PDF data required' });
        }

        // Get existing order to preserve billingDetails
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { billingDetails: true }
        });

        const existingBilling = order?.billingDetails || {};
        // Use FRONTEND_URL if available (for production), otherwise construct from request
        const pdfUrl = `/api/billing/receipt/${orderId}/pdf`;

        // Store PDF base64 in order's billingDetails (temporary - in production use file storage like S3)
        await prisma.order.update({
            where: { id: orderId },
            data: {
                billingDetails: {
                    ...existingBilling,
                    pdfBase64: pdfBase64,
                    pdfFileName: fileName
                }
            }
        });

        res.json({ pdfUrl, message: 'PDF uploaded successfully' });
    } catch (error) {
        console.error('[Receipt PDF] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Download Receipt PDF (Public - no auth required for customer to download)
router.get('/receipt/:orderId/pdf', async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log(`[PDF Download] Request for Order: ${orderId}`);
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { billingDetails: true, orderNumber: true }
        });

        if (!order) {
            console.error(`[PDF Download] Order not found: ${orderId}`);
            return res.status(404).json({ message: 'Order not found' });
        }

        const pdfBase64 = order.billingDetails?.pdfBase64;
        if (!pdfBase64) {
            console.error(`[PDF Download] PDF data missing for Order: ${orderId}`);
            return res.status(404).json({ message: 'PDF not found for this order' });
        }
        console.log(`[PDF Download] Serving PDF for Order: ${orderId}, Size: ${pdfBase64.length}`);

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const fileName = order.billingDetails?.pdfFileName || `Bill-${order.orderNumber}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('[Receipt PDF Download] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get Invoice Data
router.get('/:id/invoice', protect, async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: { include: { menuItem: true } },
                createdBy: { select: { name: true } }
            }
        });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const settings = await prisma.settings.findFirst();

        res.json({
            order: { ...order, _id: order.id },
            restaurant: settings?.data?.restaurant,
            receiptConfig: settings?.data?.receipt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
