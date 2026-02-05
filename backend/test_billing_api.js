// const fetch = require('node-fetch'); // Using native fetch

const API_URL = 'http://localhost:5001/api';

async function testBilling() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }) // Assuming default creds
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login success.');

        console.log('2. Creating Order...');
        // Need a menu item first? Or just dummy ID?
        // Let's assume we can pass any ID if we don't validate existence strictly in creation (we do in populate but maybe safe?)
        // Better to fetch menu items first
        const menuRes = await fetch(`${API_URL}/menu/items`, { headers: { Authorization: `Bearer ${token}` } });
        const menuItems = await menuRes.json();
        if (menuItems.length === 0) {
            console.error('No menu items found to create order.');
            return;
        }
        const item = menuItems[0];
        console.log(`Using item: ${item.name} (${item._id})`);

        const orderData = {
            orderType: 'dine-in',
            tableNumber: 5,
            items: [{
                menuItem: item._id,
                name: item.name,
                price: item.price,
                quantity: 1
            }]
        };

        const createRes = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!createRes.ok) {
            console.error('Create Order failed:', await createRes.text());
            return;
        }
        const order = await createRes.json();
        console.log(`Order Created: ${order._id}`);

        console.log('3. Calculating Bill...');
        const calcRes = await fetch(`${API_URL}/billing/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                orderId: order._id,
                discountType: 'flat',
                discountValue: 0
            })
        });

        if (!calcRes.ok) {
            console.error('Calculate Bill failed:', await calcRes.text());
            return;
        }

        const bill = await calcRes.json();
        console.log('Bill Calculation Result:', JSON.stringify(bill, null, 2));

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testBilling();
