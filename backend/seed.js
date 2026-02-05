const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const MenuItem = require('./models/MenuItem');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        await MenuItem.deleteMany({});

        // Create admin user
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@restaurant.com',
            password: 'admin123',
            role: 'admin',
        });
        console.log('Admin user created:', admin.email);

        // Create categories
        const categories = await Category.insertMany([
            { name: 'Appetizers', description: 'Start your meal right', order: 1 },
            { name: 'Main Course', description: 'Hearty main dishes', order: 2 },
            { name: 'Desserts', description: 'Sweet endings', order: 3 },
            { name: 'Beverages', description: 'Refreshing drinks', order: 4 },
        ]);
        console.log('Categories created:', categories.length);

        // Create menu items
        const menuItems = await MenuItem.insertMany([
            // Appetizers
            { name: 'Spring Rolls', price: 199, category: categories[0]._id, preparationTime: 10 },
            { name: 'Chicken Wings', price: 299, category: categories[0]._id, preparationTime: 15 },
            { name: 'Garlic Bread', price: 149, category: categories[0]._id, preparationTime: 8 },
            { name: 'Soup of the Day', price: 129, category: categories[0]._id, preparationTime: 5 },

            // Main Course
            { name: 'Grilled Chicken', price: 399, category: categories[1]._id, preparationTime: 20 },
            { name: 'Butter Chicken', price: 349, category: categories[1]._id, preparationTime: 25 },
            { name: 'Paneer Tikka', price: 299, category: categories[1]._id, preparationTime: 20 },
            { name: 'Fish & Chips', price: 449, category: categories[1]._id, preparationTime: 18 },
            { name: 'Veg Biryani', price: 279, category: categories[1]._id, preparationTime: 22 },
            { name: 'Pasta Alfredo', price: 329, category: categories[1]._id, preparationTime: 15 },

            // Desserts
            { name: 'Chocolate Brownie', price: 179, category: categories[2]._id, preparationTime: 5 },
            { name: 'Ice Cream Sundae', price: 149, category: categories[2]._id, preparationTime: 5 },
            { name: 'Cheesecake', price: 199, category: categories[2]._id, preparationTime: 5 },

            // Beverages
            { name: 'Fresh Lime Soda', price: 79, category: categories[3]._id, preparationTime: 3 },
            { name: 'Cold Coffee', price: 129, category: categories[3]._id, preparationTime: 5 },
            { name: 'Mango Lassi', price: 99, category: categories[3]._id, preparationTime: 5 },
            { name: 'Masala Chai', price: 49, category: categories[3]._id, preparationTime: 5 },
        ]);
        console.log('Menu items created:', menuItems.length);

        console.log('\n✅ Database seeded successfully!');
        console.log('Login credentials: admin@restaurant.com / admin123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
