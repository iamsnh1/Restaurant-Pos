const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { prisma } = require('./config/db');

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);

// CORS - Allow all origins for public access
const corsOptions = {
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);
  socket.on('joinKitchen', () => socket.join('kitchen'));
  socket.on('joinPOS', () => socket.join('pos'));
  socket.on('disconnect', () => console.log(`[SOCKET] Client disconnected: ${socket.id}`));
});

// --- DIAGNOSTICS AT THE START ---
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: 'OK', database: 'Connected', userCount });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: error.message });
  }
});

app.get('/api/test-server', (req, res) => {
  res.json({ message: 'Server is responding', time: new Date() });
});
// ---------------------------------

app.use(cors(corsOptions));

// Manual Preflight Handler for Express 5 compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));

app.get('/', (req, res) => {
  res.send('API is running (v3)...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[CRITICAL ERROR]', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
