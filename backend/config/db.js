const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances of Prisma Client in development
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('MongoDB Connected via Prisma');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

module.exports = connectDB;
module.exports.prisma = prisma;
module.exports.connectDB = connectDB;
