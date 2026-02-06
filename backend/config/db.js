const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
}

// Configure SSL based on connection string
// Local Docker PostgreSQL doesn't support SSL, so disable it for localhost/postgres connections
const poolConfig = { connectionString };
const isLocalDB = connectionString.includes('localhost') || 
                  connectionString.includes('127.0.0.1') || 
                  connectionString.includes('postgres:5432') ||
                  connectionString.includes('@postgres:');

if (!isLocalDB) {
    // For remote databases (DigitalOcean, Railway, etc.), use SSL if not already specified
    if (!connectionString.includes('sslmode=')) {
        poolConfig.ssl = { rejectUnauthorized: true };
    }
}
// For local DB, no SSL config needed (default is no SSL)
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
