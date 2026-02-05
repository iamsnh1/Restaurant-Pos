const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: Date, // Normalized to midnight for easy querying
            required: true,
        },
        clockIn: {
            type: Date,
            required: true,
        },
        clockOut: {
            type: Date,
        },
        breaks: [
            {
                start: { type: Date },
                end: { type: Date },
            },
        ],
        status: {
            type: String,
            enum: ['present', 'finished'],
            default: 'present',
        },
        totalHours: {
            type: Number, // Calculated on clockOut
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
