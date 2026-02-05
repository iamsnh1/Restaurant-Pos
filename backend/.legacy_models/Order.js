const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    name: String,
    price: Number,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    variant: String,
    specialInstructions: String,
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'served'],
        default: 'pending',
    },
    statusHistory: [
        {
            status: String,
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

const orderSchema = mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        orderType: {
            type: String,
            enum: ['dine-in', 'takeaway', 'delivery'],
            default: 'dine-in',
        },
        tableNumber: {
            type: Number,
        },
        items: [orderItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        tip: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
        billingDetails: {
            itemTotal: { type: Number, default: 0 },
            discountAmount: { type: Number, default: 0 },
            discountType: { type: String, enum: ['flat', 'percent'] },
            discountValue: { type: Number },
            taxDetails: [
                {
                    name: String,
                    rate: Number,
                    amount: Number
                }
            ],
            taxableAmount: { type: Number, default: 0 },
            totalTax: { type: Number, default: 0 },
            roundOff: { type: Number, default: 0 },
            grandTotal: { type: Number, required: true }
        },
        transactions: [
            {
                amount: { type: Number, required: true },
                paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'wallet', 'bank_transfer', 'split'], required: true },
                transactionId: String,
                status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
                timestamp: { type: Date, default: Date.now },
                note: String
            }
        ],
        isSplitted: { type: Boolean, default: false },

        status: {
            type: String,
            enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'partially_paid', 'paid', 'refunded'],
            default: 'unpaid',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'upi', 'wallet'],
        },
        customer: {
            name: String,
            phone: String,
            email: String,
            gstin: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Generate order number before validation
orderSchema.pre('validate', async function () {
    if (!this.orderNumber) {
        const count = await mongoose.model('Order').countDocuments();
        const today = new Date();
        const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    }

    // Status history tracking
    if (this.isModified('status')) {
        // If statusHistory doesn't exist (legacy), init it
        if (!this.statusHistory) this.statusHistory = [];
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
