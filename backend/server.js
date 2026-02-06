const dotenv = require('dotenv');
dotenv.config();

console.log('--- [AWS DIAGNOSTICS] STARTING ---');
console.log('Folder:', __dirname);
console.log('DB URL Present:', !!process.env.DATABASE_URL);

// CRITICAL: Catch errors before they kill the server
process.on('uncaughtException', (err) => {
  console.error('❌ FATAL CRASH PREVENTED:', err.message);
  console.error(err.stack);
});

const express = require('express');
const http = require('http');
const cors = require('cors');
const { connectDB, prisma } = require('./config/db');

const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);

// 1. IMMEDIATE HEALTH CHECK (Must be first for AWS)
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '10mb' }));

// 2. MANUAL CORS/OPTIONS HANDLER
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 3. ALL ROUTES
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/categories', require('./routes/categoryRoutes'));
  app.use('/api/menu', require('./routes/menuRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/tables', require('./routes/tableRoutes'));
  app.use('/api/reports', require('./routes/reportRoutes'));
  app.use('/api/staff', require('./routes/staffRoutes'));
  app.use('/api/settings', require('./routes/settingsRoutes'));
  app.use('/api/billing', require('./routes/billingRoutes'));
  app.use('/api/reservations', require('./routes/reservationRoutes'));
} catch (e) {
  console.error('❌ Error Loading Routes:', e.message);
}

app.get('/', (req, res) => res.send('Voxxera POS API - AWS Live'));

// 4. START SERVER
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

async function ignite() {
  try {
    console.log('--- [AWS] Connecting to Database... ---');
    await connectDB();

    server.listen(PORT, HOST, () => {
      console.log(`🚀 SUCCESS: Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ DB Failure but keeping server alive for logs:', err.message);
    server.listen(PORT, HOST, () => {
      console.log(`⚠️ SAFE MODE: Server listening on port ${PORT}`);
    });
  }
}

ignite();

module.exports = app;
