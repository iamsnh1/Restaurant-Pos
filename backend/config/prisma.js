const { PrismaClient } = require('@prisma/client');

// SQLite database (local file storage)
const prisma = new PrismaClient();

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('SQLite Database Connected (Local Storage)');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { prisma, connectDB };
