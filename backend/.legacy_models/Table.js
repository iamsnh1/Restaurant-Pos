const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: true,
            unique: true,
        },
        capacity: {
            type: Number,
            required: true,
            default: 4,
        },
        status: {
            type: String,
            enum: ['available', 'occupied', 'reserved', 'cleaning'],
            default: 'available',
        },
        currentOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
        },
        position: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
        },
        shape: {
            type: String,
            enum: ['square', 'round', 'rectangle'],
            default: 'square',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
