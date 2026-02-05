const mongoose = require('mongoose');
const Order = require('./models/Order');
const Settings = require('./models/Settings');
const MenuItem = require('./models/MenuItem');

async function debugBilling() {
    try {
        await mongoose.connect('mongodb://localhost:27017/restaurant-pos');
        console.log('MongoDB Connected');

        // 1. Ensure a MenuItem exists
        let item = await MenuItem.findOne();
        if (!item) {
            console.log('Creating dummy MenuItem...');
            item = await MenuItem.create({
                name: 'Debug Item',
                price: 100,
                category: new mongoose.Types.ObjectId(), // Fake ID
                description: 'Test item'
            });
        }
        console.log(`Using MenuItem: ${item.name} (${item._id}) Price: ${item.price}`);

        // 2. Create an Order
        console.log('Creating Order...');
        const orderData = {
            orderType: 'dine-in',
            tableNumber: 1,
            items: [{
                menuItem: item._id,
                name: item.name,
                price: item.price,
                quantity: 2
            }],
            subtotal: item.price * 2,
            tax: item.price * 2 * 0.05,
            total: item.price * 2 * 1.05,
            billingDetails: { // Providing legacy structure
                grandTotal: item.price * 2 * 1.05
            }
        };

        const order = await Order.create(orderData);
        console.log(`Order Created: ${order._id}`);

        // 3. Test Calculation Logic (Simulating billingRoutes)
        console.log('--- Testing Calculation ---');

        // Fetch fresh with populate
        const fetchedOrder = await Order.findById(order._id).populate('items.menuItem');

        // Settings
        const settings = await Settings.findOne();
        const taxRates = settings?.financials?.taxRates || [];

        // Calc
        let itemTotal = 0;
        fetchedOrder.items.forEach(i => {
            const line = i.price * i.quantity;
            console.log(`Line from Order items: ${i.price} * ${i.quantity} = ${line}`);
            itemTotal += line;
        });

        console.log(`Calculated ItemTotal: ${itemTotal}`);

        if (itemTotal === 200) {
            console.log('SUCCESS: Calculation logic works locally.');
        } else {
            console.log('FAILURE: Calculation output mismatch.');
        }

    } catch (error) {
        console.error('Debug Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugBilling();
