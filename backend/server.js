const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);

// CORS - Allow all origins for public access
// In production, you may want to restrict this to specific domains
const corsOptions = {
  origin: '*', // Allow all origins explicitly for cloud deployment
  credentials: false, // Must be false when origin is '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
});

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // Join kitchen room for KDS updates
  socket.on('joinKitchen', () => {
    socket.join('kitchen');
    const roomSize = io.sockets.adapter.rooms.get('kitchen')?.size || 0;
    console.log(`[SOCKET] ${socket.id} joined kitchen room (${roomSize} clients in room)`);
  });

  // Join POS room for order updates
  socket.on('joinPOS', () => {
    socket.join('pos');
    console.log(`${socket.id} joined POS room`);
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors(corsOptions));
app.options('(.*)', cors(corsOptions)); // Handle preflight requests for Express 5.x
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
  res.send('API is running...');
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for network access

// Vercel serverless function export
if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT} with Socket.io`);
    console.log(`📡 Accessible from network at: http://YOUR_IP:${PORT}`);
    console.log(`🌐 API available at: http://YOUR_IP:${PORT}/api`);
    console.log(`\n✅ First-time setup: POST http://YOUR_IP:${PORT}/api/auth/setup`);
  });
}
module.exports = app;
