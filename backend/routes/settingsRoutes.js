const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect, admin } = require('../middleware/authMiddleware');

function getDefaultSettingsData() {
    return {
        restaurant: { name: '', email: '', phone: '', gstin: '', theme: 'dark', address: '' },
        financials: { currency: 'INR', currencySymbol: '₹', taxRates: [] },
        receipt: { footer: '' },
        printSettings: { printers: [] },
        operatingHours: {},
        notifications: {}
    };
}

function normalizeSettingsData(data) {
    const defaults = getDefaultSettingsData();
    return {
        restaurant: { ...defaults.restaurant, ...(data?.restaurant || {}) },
        financials: {
            ...defaults.financials,
            ...(data?.financials || {}),
            taxRates: Array.isArray(data?.financials?.taxRates) ? data.financials.taxRates : defaults.financials.taxRates
        },
        receipt: { ...defaults.receipt, ...(data?.receipt || {}) },
        printSettings: {
            printers: Array.isArray(data?.printSettings?.printers) ? data.printSettings.printers : defaults.printSettings.printers
        },
        operatingHours: { ...(data?.operatingHours || {}) },
        notifications: { ...(data?.notifications || {}) }
    };
}

// Get Public Settings (for digital receipts)
router.get('/public', async (req, res) => {
    try {
        const settings = await prisma.settings.findFirst();
        const data = settings?.data ? (typeof settings.data === 'object' ? settings.data : {}) : {};
        res.json(normalizeSettingsData(data));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Settings (create default row if none exists)
router.get('/', protect, async (req, res) => {
    try {
        let settings = await prisma.settings.findFirst();
        if (!settings) {
            settings = await prisma.settings.create({
                data: { data: getDefaultSettingsData() }
            });
        }
        const data = settings.data && typeof settings.data === 'object' ? settings.data : {};
        res.json(normalizeSettingsData(data));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Settings
router.put('/', protect, admin, async (req, res) => {
    try {
        let settings = await prisma.settings.findFirst();
        const existingData = settings?.data && typeof settings.data === 'object' ? settings.data : {};
        const merged = normalizeSettingsData({
            ...existingData,
            restaurant: { ...existingData.restaurant, ...(req.body?.restaurant || {}) },
            financials: {
                ...existingData.financials,
                ...(req.body?.financials || {}),
                taxRates: Array.isArray(req.body?.financials?.taxRates) ? req.body.financials.taxRates : (existingData.financials?.taxRates || [])
            },
            receipt: { ...existingData.receipt, ...(req.body?.receipt || {}) },
            printSettings: {
                printers: Array.isArray(req.body?.printSettings?.printers) ? req.body.printSettings.printers : (existingData.printSettings?.printers || [])
            },
            operatingHours: { ...existingData.operatingHours, ...(req.body?.operatingHours || {}) },
            notifications: { ...existingData.notifications, ...(req.body?.notifications || {}) }
        });

        if (settings) {
            await prisma.settings.update({
                where: { id: settings.id },
                data: { data: merged }
            });
        } else {
            await prisma.settings.create({
                data: { data: merged }
            });
        }
        res.json(merged);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Backup (Mock)
router.post('/backup', protect, admin, async (req, res) => {
    try {
        // In a real app, this would involve mongodump or JSON export
        res.json({ message: 'Backup created successfully', timestamp: new Date() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
