const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

// DigitalOcean managed DB often requires SSL; URL may include ?sslmode=require
const poolConfig = { connectionString };
if (process.env.NODE_ENV === 'production' && !connectionString.includes('sslmode=')) {
    poolConfig.ssl = { rejectUnauthorized: true };
}
const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL Connected via Prisma');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
module.exports.prisma = prisma;
module.exports.connectDB = connectDB; // For named import compatibility
