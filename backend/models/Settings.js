const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
    {
        restaurant: {
            name: { type: String, default: 'My Restaurant' },
            address: { type: String, default: '' },
            phone: { type: String, default: '' },
            email: { type: String, default: '' },
            website: { type: String, default: '' },
            logoUrl: { type: String, default: '' },
            gstin: { type: String, default: '' }, // GST Identification Number
        },
        financials: {
            currency: { type: String, default: 'USD' },
            currencySymbol: { type: String, default: '$' },
            taxRates: [
                {
                    name: { type: String },
                    rate: { type: Number },
                    isDefault: { type: Boolean, default: false },
                },
            ],
        },
        operatingHours: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '22:00' },
            days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        },
        receipt: {
            header: { type: String, default: 'Welcome!' },
            footer: { type: String, default: 'Thank you for dining with us!' },
            showLogo: { type: Boolean, default: true },
        },
        printSettings: {
            printers: [
                {
                    name: { type: String },
                    type: { type: String, enum: ['receipt', 'kot', 'label'] },
                    ip: { type: String },
                    port: { type: Number, default: 9100 },
                },
            ],
        },
        notifications: {
            emailAlerts: { type: Boolean, default: false },
            emailAddress: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
