const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Seeding database...');

    // 1. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@restaurant.com' },
        update: {},
        create: {
            email: 'admin@restaurant.com',
            name: 'Main Admin',
            password: hashedPassword,
            role: 'admin',
        },
    });
    console.log('Admin user created:', admin.email);

    // 2. Create Categories & Items
    const categoryData = [
        {
            name: 'Appetizers', description: 'Start your meal right', order: 1,
            items: [
                { name: 'Spring Rolls', price: 199, preparationTime: 10 },
                { name: 'Chicken Wings', price: 299, preparationTime: 15 },
                { name: 'Garlic Bread', price: 149, preparationTime: 8 },
                { name: 'Soup of the Day', price: 129, preparationTime: 5 },
            ]
        },
        {
            name: 'Main Course', description: 'Hearty main dishes', order: 2,
            items: [
                { name: 'Grilled Chicken', price: 399, preparationTime: 20 },
                { name: 'Butter Chicken', price: 349, preparationTime: 25 },
                { name: 'Paneer Tikka', price: 299, preparationTime: 20 },
                { name: 'Fish & Chips', price: 449, preparationTime: 18 },
                { name: 'Veg Biryani', price: 279, preparationTime: 22 },
                { name: 'Pasta Alfredo', price: 329, preparationTime: 15 },
            ]
        },
        {
            name: 'Desserts', description: 'Sweet endings', order: 3,
            items: [
                { name: 'Chocolate Brownie', price: 179, preparationTime: 5 },
                { name: 'Ice Cream Sundae', price: 149, preparationTime: 5 },
                { name: 'Cheesecake', price: 199, preparationTime: 5 },
            ]
        },
        {
            name: 'Beverages', description: 'Refreshing drinks', order: 4,
            items: [
                { name: 'Fresh Lime Soda', price: 79, preparationTime: 3 },
                { name: 'Cold Coffee', price: 129, preparationTime: 5 },
                { name: 'Mango Lassi', price: 99, preparationTime: 5 },
                { name: 'Masala Chai', price: 49, preparationTime: 5 },
            ]
        },
    ];

    for (const cat of categoryData) {
        let category = await prisma.category.findFirst({ where: { name: cat.name } });
        if (!category) {
            category = await prisma.category.create({
                data: {
                    name: cat.name,
                    description: cat.description,
                    order: cat.order,
                }
            });
        }

        for (const item of cat.items) {
            const existingItem = await prisma.menuItem.findFirst({ where: { name: item.name } });
            if (!existingItem) {
                await prisma.menuItem.create({
                    data: {
                        name: item.name,
                        price: item.price,
                        preparationTime: item.preparationTime,
                        categoryId: category.id
                    }
                });
            }
        }
    }
    console.log('Categories and Menu Items seeded.');

    // 3. Create Tables
    const tablesCount = await prisma.table.count();
    if (tablesCount === 0) {
        const tables = [];
        for (let i = 1; i <= 12; i++) {
            tables.push({
                number: i,
                capacity: i <= 5 ? 2 : (i <= 10 ? 4 : 8),
                status: 'available',
                section: i <= 8 ? 'Indoor' : 'Outdoor'
            });
        }
        await prisma.table.createMany({ data: tables });
        console.log('Tables seeded.');
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
