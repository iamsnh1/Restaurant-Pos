const mongoose = require('mongoose');

const shiftSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        notes: {
            type: String,
        },
        published: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    }
);

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift;
