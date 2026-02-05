const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
        },
        customerPhone: {
            type: String,
            required: true,
        },
        customerEmail: String,
        partySize: {
            type: Number,
            required: true,
            min: 1,
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        tableNumber: {
            type: Number,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
            default: 'pending',
        },
        specialRequests: String,
        depositAmount: {
            type: Number,
            default: 0,
        },
        depositPaid: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);
