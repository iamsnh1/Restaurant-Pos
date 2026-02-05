const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/authMiddleware');

// Get Settings (Create default if not exists)
// Get Public Settings (for digital receipts)
router.get('/public', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json(settings || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Settings
router.put('/', protect, admin, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            // Deep merge or specific field updates
            settings.restaurant = { ...settings.restaurant, ...req.body.restaurant };
            settings.financials = { ...settings.financials, ...req.body.financials };
            settings.operatingHours = { ...settings.operatingHours, ...req.body.operatingHours };
            settings.receipt = { ...settings.receipt, ...req.body.receipt };
            settings.printSettings = { ...settings.printSettings, ...req.body.printSettings };
            settings.notifications = { ...settings.notifications, ...req.body.notifications };
        }

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
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
