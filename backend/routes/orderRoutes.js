const express = require('express');
const router = express.Router();
const {
    getOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    updatePayment,
    getKitchenOrders,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getOrders).post(protect, createOrder);
router.get('/kitchen', protect, getKitchenOrders);
router.get('/public/:id', getOrder); // Public route for digital receipts
router.route('/:id').get(protect, getOrder);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/payment', protect, updatePayment);

module.exports = router;
