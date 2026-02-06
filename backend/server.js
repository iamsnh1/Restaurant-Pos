const dotenv = require('dotenv');
dotenv.config();

// EXIT PROTECTION: Catch any crash instantly
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
});

console.log('--- SERVER STARTING UP ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) : 'MISSING');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB, prisma } = require('./config/db');

const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);

// Manual Preflight Handler (Fixes CORS and AWS Health Checks)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));

// Health Check (Strictly for AWS)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AWS Health Check Passed' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'AWS Server is Alive' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));

app.get('/', (req, res) => {
  res.status(200).send('API is running (AWS Resilient Mode)');
});

// Start Server
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

async function startServer() {
  try {
    console.log('--- INITIALIZING DB ---');
    await connectDB();

    server.listen(PORT, HOST, () => {
      console.log(`🚀 AWS Server successfully listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ FAILED TO START SERVER:', error.message);
    // On AWS, we must keep the process alive even if it fails, to read logs
    server.listen(PORT, HOST, () => {
      console.log(`⚠️ Server running in SAFE MODE on port ${PORT} despite DB error`);
    });
  }
}

startServer();

module.exports = app;
