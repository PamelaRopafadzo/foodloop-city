'use strict';

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const http       = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:  process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { error: 'Too many requests, try again later' }
}));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
// app.use('/api/products',  require('./routes/products'));
// app.use('/api/inventory', require('./routes/inventory'));
// app.use('/api/sales',     require('./routes/sales'));
// app.use('/api/donations', require('./routes/donations'));
// app.use('/api/analytics', require('./routes/analytics'));
// app.use('/api/admin',     require('./routes/admin'));
// app.use('/api/reports',   require('./routes/reports'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── WebSocket handlers ────────────────────────────────────────────────────
require('./sockets/handlers')(io);

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status  = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message;
  console.error(`[${status}] ${err.message}`);
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    server.listen(PORT, () => {
      console.log(`🚀 FoodLoop running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
};

start();

module.exports = { app, server, io };