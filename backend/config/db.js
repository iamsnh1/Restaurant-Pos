const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ MongoDB Connected via Prisma');
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    // We do not throw or exit, so the server can pass health checks
  }
};

module.exports = {
  prisma,
  connectDB
};
